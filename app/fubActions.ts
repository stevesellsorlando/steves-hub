"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncFromFub } from "@/lib/fubSync";
import { importNotesBatch } from "@/lib/fubNotes";

// Used by both "Import them" (first time) and "Sync now"
export async function syncNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  let msg: string;
  try {
    const r = await syncFromFub(supabase, user.id);
    msg = `Done! ${r.total} people checked: ${r.created} new, ${r.updated} updated.`;
  } catch (e) {
    msg = `Something went wrong: ${e instanceof Error ? e.message : String(e)}`;
  }
  revalidatePath("/", "layout");
  redirect(`/settings?msg=${encodeURIComponent(msg)}`);
}

// One batch of notes (about 40 seconds). The Settings page calls this again and again until done.
export async function importNotesNow(): Promise<{ done: number; notesAdded: number; remaining: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { done: 0, notesAdded: 0, remaining: 0, error: "Please sign in again." };
  try {
    return await importNotesBatch(supabase, user.id, 40000);
  } catch (e) {
    return { done: 0, notesAdded: 0, remaining: -1, error: e instanceof Error ? e.message : String(e) };
  }
}
