// Follow Up Boss tasks -> the hub's Tasks page (open ones, everyone's, labeled with who they're for)
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOpenTasks } from "./fub";
import { LISTS, type ListKey } from "./constants";
import { TZ } from "./dates";

export async function syncFubTasks(supabase: SupabaseClient, userId: string) {
  const open = await fetchOpenTasks();

  // Which hub card each Follow Up Boss person is
  const fubIds = Array.from(new Set(open.map((t) => t.personId).filter(Boolean))) as number[];
  const byFub = new Map<number, { id: string; list: ListKey }>();
  for (let i = 0; i < fubIds.length; i += 300) {
    const { data } = await supabase.from("people").select("id, list, fub_id").eq("user_id", userId).in("fub_id", fubIds.slice(i, i + 300));
    for (const p of data ?? []) byFub.set(Number(p.fub_id), { id: p.id, list: p.list as ListKey });
  }

  const rows = open.map((t) => {
    const person = t.personId ? byFub.get(t.personId) : undefined;
    let due = (t.dueDate ?? "").slice(0, 10);
    let time: string | null = null;
    if (t.dueDateTime) {
      const d = new Date(t.dueDateTime);
      if (!isNaN(d.getTime())) {
        due = d.toLocaleDateString("en-CA", { timeZone: TZ });
        const hm = d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
        if (!/^12:00\s?AM$/i.test(hm)) time = hm;
      }
    }
    return {
      user_id: userId,
      fub_task_id: t.id,
      person_id: person?.id ?? null,
      title: (t.name ?? "").trim() || t.type || "Task",
      type: person ? LISTS[person.list].taskType : "Other",
      due_date: due || new Date().toISOString().slice(0, 10),
      due_time: time,
      assigned_to: t.assignedTo ?? null,
      done_at: null,
    };
  });

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("tasks").upsert(rows.slice(i, i + 500), { onConflict: "user_id,fub_task_id" });
    if (error) throw new Error(error.message);
  }

  // Finished (or deleted) in Follow Up Boss? Mark done in the hub too.
  const openIds = new Set(open.map((t) => t.id));
  const { data: hubOpen } = await supabase.from("tasks").select("id, fub_task_id").eq("user_id", userId).not("fub_task_id", "is", null).is("done_at", null);
  const finished = (hubOpen ?? []).filter((t) => !openIds.has(Number(t.fub_task_id))).map((t) => t.id);
  for (let i = 0; i < finished.length; i += 300) {
    await supabase.from("tasks").update({ done_at: new Date().toISOString() }).in("id", finished.slice(i, i + 300));
  }
  return { tasks: rows.length, finished: finished.length };
}
