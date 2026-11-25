"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addEvent, calendarToken } from "@/lib/calendar";
import { saveNote } from "@/lib/saveNote";

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

const prettyWhen = (date: string, time: string | null) => {
  const d = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
  if (!time) return d;
  const [h, m] = time.split(":").map(Number);
  return `${d} at ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

// From the Calendar page, or the "Appointment" tab on a card (then person_id is set)
export async function createEvent(fd: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const title = str(fd, "title");
  const date = str(fd, "date");
  const personId = str(fd, "person_id");
  const back = personId ? `/people/${personId}` : "/calendar";
  if (!title || !date) redirect(`${back}?msg=${encodeURIComponent("Please add a title and a date.")}`);
  const time = str(fd, "time");
  let msg: string;
  try {
    const token = await calendarToken(supabase, user.id);
    await addEvent(token, { title: title!, date: date!, time, minutes: Number(str(fd, "minutes") ?? 60), location: str(fd, "location"), notes: str(fd, "notes") });
    if (personId) await saveNote(supabase, personId, "note", `📅 Appointment set: ${title} · ${prettyWhen(date!, time)}${str(fd, "location") ? ` · ${str(fd, "location")}` : ""}`);
    msg = `✓ Added to your Google Calendar: ${title}, ${prettyWhen(date!, time)}. You'll get a reminder 30 minutes before.`;
  } catch (e) {
    msg = `Not added: ${e instanceof Error ? e.message : String(e)}`;
  }
  revalidatePath("/", "layout");
  redirect(`${back}?msg=${encodeURIComponent(msg)}`);
}

export async function saveShownCalendars(fd: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const ids = fd.getAll("cal").map(String);
  await supabase.from("google_accounts").update({ shown_calendars: ids }).eq("user_id", user.id);
  revalidatePath("/", "layout");
  redirect(`/settings?msg=${encodeURIComponent("✓ Calendars saved.")}`);
}
