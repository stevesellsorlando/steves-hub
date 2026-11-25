"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FOLLOW_UPS, LISTS, isListKey, defaultStage, type ListKey } from "@/lib/constants";
import { addDaysISO, todayISO } from "@/lib/dates";
import { saveNote } from "@/lib/saveNote";
import { contactList, flatFields, type ContactKind } from "@/lib/contact";
import { updateFubNote, fubConfigured, updateFubTask, deleteFubTask } from "@/lib/fub";
import type { Person } from "@/lib/types";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function followUpDate(fd: FormData): string | null {
  const choice = str(fd, "followup");
  if (!choice || choice === "none") return null;
  if (choice === "date") return str(fd, "followup_date");
  const f = FOLLOW_UPS.find((x) => x.key === choice);
  return f ? addDaysISO(todayISO(), f.days) : null;
}

async function db() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

// ---------- Sign in / out ----------

export async function signIn(_prev: string | null, fd: FormData): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(fd, "email") ?? "",
    password: (fd.get("password") as string) ?? "",
  });
  if (error) return "That email or password didn't work. Please try again.";
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- The fast after-call screen ----------

export async function quickAdd(fd: FormData) {
  const supabase = await db();
  const listRaw = str(fd, "list");
  const list: ListKey = isListKey(listRaw) ? listRaw : "client";
  const name = str(fd, "name");
  if (!name) redirect(`/people/new?list=${list}&error=name`);

  const { data: person, error } = await supabase
    .from("people")
    .insert({
      list,
      name,
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      property_address: str(fd, "property_address"),
      stage: str(fd, "stage") ?? defaultStage(list),
      lead_source: str(fd, "lead_source"),
      last_contacted_at: fd.get("called") ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !person) throw new Error(error?.message ?? "Could not save");

  const note = str(fd, "note");
  if (fd.get("called")) {
    await supabase.from("notes").insert({ person_id: person.id, kind: "call", body: note ?? "Called" });
  } else if (note) {
    await supabase.from("notes").insert({ person_id: person.id, kind: "note", body: note });
  }

  const due = followUpDate(fd);
  if (due) {
    await supabase.from("tasks").insert({
      person_id: person.id,
      title: str(fd, "followup_title") ?? `Follow up with ${name}`,
      type: LISTS[list].taskType,
      due_date: due,
    });
  }

  revalidatePath("/", "layout");
  redirect(`/people/new?list=${list}&saved=${person.id}`);
}

// ---------- Cards ----------

const DETAIL_FIELDS = [
  "name", "stage", "buyer_seller", "agreement", "lead_source", "phone", "phone2", "email", "email2",
  "address", "property_address", "timeframe", "price_in_mind", "reason_selling", "moving_to",
  "mortgage_status", "preapproved", "lender", "price_range", "closing_date", "best_time_to_call",
  "preferred_contact", "social_media", "birthday", "home_anniversary", "kids", "deceased_name",
  "relationship", "attorney_name", "attorney_phone", "case_number", "date_filed", "mls_number",
  "list_price", "expired_date", "previous_agent",
];

export async function updatePerson(id: string, fd: FormData) {
  const supabase = await db();
  const patch: Record<string, unknown> = {};
  for (const f of DETAIL_FIELDS) if (fd.has(f)) patch[f] = str(fd, f);
  if (!patch.name) delete patch.name;
  if (fd.has("tags")) {
    patch.tags = (str(fd, "tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  const { error } = await supabase.from("people").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}?saved=1`);
}

export async function setStage(id: string, fd: FormData) {
  const supabase = await db();
  await supabase.from("people").update({ stage: str(fd, "stage") }).eq("id", id);
  revalidatePath(`/people/${id}`);
}

export async function addNote(personId: string, fd: FormData) {
  const supabase = await db();
  const body = str(fd, "body");
  if (body) await saveNote(supabase, personId, "note", body);

  const due = followUpDate(fd);
  if (due) {
    const { data: p } = await supabase.from("people").select("name, list").eq("id", personId).single();
    if (p) {
      await supabase.from("tasks").insert({
        person_id: personId,
        title: `Follow up with ${p.name}`,
        type: LISTS[p.list as ListKey].taskType,
        due_date: due,
      });
    }
  }
  revalidatePath(`/people/${personId}`);
}

export async function logTouch(personId: string, kind: "call" | "text") {
  const supabase = await db();
  await saveNote(supabase, personId, kind, kind === "call" ? "Called" : "Texted");
  await supabase.from("people").update({ last_contacted_at: new Date().toISOString() }).eq("id", personId);
  revalidatePath(`/people/${personId}`);
}

export async function setFollowUp(personId: string, fd: FormData) {
  const supabase = await db();
  const due = followUpDate(fd);
  if (!due) return;
  const { data: p } = await supabase.from("people").select("name, list").eq("id", personId).single();
  if (!p) return;
  await supabase.from("tasks").insert({
    person_id: personId,
    title: str(fd, "title") ?? `Follow up with ${p.name}`,
    type: LISTS[p.list as ListKey].taskType,
    due_date: due,
  });
  revalidatePath(`/people/${personId}`);
}

export async function moveToClients(personId: string) {
  const supabase = await db();
  await supabase.from("people").update({ list: "client", stage: "Active Client" }).eq("id", personId);
  await supabase
    .from("notes")
    .insert({ person_id: personId, kind: "note", body: "Moved to Clients (became a client) 🎉" });
  await supabase.from("tasks").update({ type: "Client" }).eq("person_id", personId).is("done_at", null);
  revalidatePath("/", "layout");
  redirect(`/people/${personId}`);
}

export async function deletePerson(personId: string, list: ListKey) {
  const supabase = await db();
  await supabase.from("people").delete().eq("id", personId);
  revalidatePath("/", "layout");
  redirect(LISTS[list].path);
}

// ---------- To-dos ----------

async function fubTaskId(supabase: Awaited<ReturnType<typeof db>>, taskId: string) {
  const { data } = await supabase.from("tasks").select("fub_task_id").eq("id", taskId).single();
  return data?.fub_task_id && fubConfigured() ? Number(data.fub_task_id) : null;
}

export async function completeTask(taskId: string) {
  const supabase = await db();
  await supabase.from("tasks").update({ done_at: new Date().toISOString() }).eq("id", taskId);
  const fid = await fubTaskId(supabase, taskId);
  if (fid) {
    try {
      await updateFubTask(fid, { isCompleted: true });
    } catch {}
  }
  revalidatePath("/", "layout");
}

export async function undoTask(taskId: string) {
  const supabase = await db();
  await supabase.from("tasks").update({ done_at: null }).eq("id", taskId);
  const fid = await fubTaskId(supabase, taskId);
  if (fid) {
    try {
      await updateFubTask(fid, { isCompleted: false });
    } catch {}
  }
  revalidatePath("/", "layout");
}

export async function addTask(fd: FormData) {
  const supabase = await db();
  const title = str(fd, "title");
  if (!title) return;
  await supabase.from("tasks").insert({
    title,
    type: str(fd, "type") ?? "Other",
    due_date: followUpDate(fd) ?? str(fd, "due_date") ?? todayISO(),
  });
  revalidatePath("/", "layout");
}

// ---------- Log a call with notes ----------

export async function logCallNote(personId: string, fd: FormData) {
  const supabase = await db();
  const what = str(fd, "body");
  const outcome = str(fd, "outcome");
  const body = ["Called" + (outcome ? `: ${outcome}` : ""), what].filter(Boolean).join("\n");
  await saveNote(supabase, personId, "call", body);
  await supabase.from("people").update({ last_contacted_at: new Date().toISOString() }).eq("id", personId);
  const due = followUpDate(fd);
  if (due) {
    const { data: p } = await supabase.from("people").select("name, list").eq("id", personId).single();
    if (p) {
      await supabase.from("tasks").insert({ person_id: personId, title: `Follow up with ${p.name}`, type: LISTS[p.list as ListKey].taskType, due_date: due });
    }
  }
  revalidatePath(`/people/${personId}`);
}

// ---------- Relationships (spouse, realtor, attorney...) ----------

export async function addRelationship(personId: string, fd: FormData) {
  const supabase = await db();
  const name = str(fd, "name");
  if (!name) return;
  await supabase.from("relationships").insert({
    person_id: personId,
    name,
    label: str(fd, "label"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    address: str(fd, "address"),
  });
  revalidatePath(`/people/${personId}`);
}

export async function deleteRelationship(relId: string, personId: string) {
  const supabase = await db();
  await supabase.from("relationships").delete().eq("id", relId);
  revalidatePath(`/people/${personId}`);
}

// ---------- Edit buttons (✏️) on the card ----------

export async function renamePerson(personId: string, fd: FormData) {
  const supabase = await db();
  const name = str(fd, "name");
  if (name) await supabase.from("people").update({ name }).eq("id", personId);
  revalidatePath(`/people/${personId}`);
}

// op: "save" changes item #index (or adds when index is -1), "delete" removes it
export async function editContact(personId: string, kind: ContactKind, index: number, fd: FormData) {
  const supabase = await db();
  const { data: p } = await supabase.from("people").select("*").eq("id", personId).single<Person>();
  if (!p) return;
  const list = contactList(p, kind);
  if (fd.get("op") === "delete") {
    if (index >= 0) list.splice(index, 1);
  } else {
    const value = str(fd, "value");
    if (!value) return;
    const item = { value, label: str(fd, "label") };
    if (index >= 0 && index < list.length) list[index] = item;
    else list.push(item);
  }
  await supabase.from("people").update(flatFields(kind, list)).eq("id", personId);
  revalidatePath(`/people/${personId}`);
}

export async function setTags(personId: string, fd: FormData) {
  const supabase = await db();
  const tags = (str(fd, "tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  await supabase.from("people").update({ tags: Array.from(new Set(tags)) }).eq("id", personId);
  revalidatePath(`/people/${personId}`);
}

export async function editNote(noteId: string, personId: string, fd: FormData) {
  const supabase = await db();
  const body = str(fd, "body");
  if (!body) return;
  const { data: n } = await supabase.from("notes").update({ body }).eq("id", noteId).select("fub_note_id").single();
  // Notes that also live in Follow Up Boss get the same change there
  const m = n?.fub_note_id?.match(/^note-(\d+)$/);
  if (m && fubConfigured()) {
    try {
      await updateFubNote(Number(m[1]), body);
    } catch {}
  }
  revalidatePath(`/people/${personId}`);
}

export async function hideNote(noteId: string, personId: string) {
  const supabase = await db();
  await supabase.from("notes").update({ hidden: true }).eq("id", noteId);
  revalidatePath(`/people/${personId}`);
}

export async function editTask(taskId: string, personId: string | null, fd: FormData) {
  const supabase = await db();
  const patch: Record<string, unknown> = {};
  const title = str(fd, "title");
  const due = str(fd, "due_date");
  if (title) patch.title = title;
  if (due) patch.due_date = due;
  if (Object.keys(patch).length) {
    await supabase.from("tasks").update(patch).eq("id", taskId);
    const fid = await fubTaskId(supabase, taskId);
    if (fid) {
      try {
        await updateFubTask(fid, { name: title ?? undefined, dueDate: due ?? undefined });
      } catch {}
    }
  }
  revalidatePath("/", "layout");
}

export async function deleteTask(taskId: string) {
  const supabase = await db();
  const fid = await fubTaskId(supabase, taskId);
  if (fid) {
    try {
      await deleteFubTask(fid);
    } catch {}
  }
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath("/", "layout");
}

export async function editRelationship(relId: string, personId: string, fd: FormData) {
  const supabase = await db();
  const name = str(fd, "name");
  if (!name) return;
  await supabase
    .from("relationships")
    .update({ name, label: str(fd, "label"), phone: str(fd, "phone"), email: str(fd, "email"), address: str(fd, "address") })
    .eq("id", relId);
  revalidatePath(`/people/${personId}`);
}
