import type { SupabaseClient } from "@supabase/supabase-js";
import { addFubNote, fubConfigured } from "./fub";

// Saves a note in the hub, and (if the person came from Follow Up Boss) also adds it to their
// Follow Up Boss timeline. The Follow Up Boss note ID is remembered so it never gets brought back as a double.
export async function saveNote(supabase: SupabaseClient, personId: string, kind: string, body: string) {
  const { data: note } = await supabase.from("notes").insert({ person_id: personId, kind, body }).select("id").single();
  if (!note || !fubConfigured()) return;
  const { data: p } = await supabase.from("people").select("fub_id").eq("id", personId).single();
  if (!p?.fub_id) return;
  try {
    const fubBody = kind === "email" ? `${body}\n\n(Sent from Steve's Hub through Gmail)` : kind === "call" && body === "Called" ? "Called (logged in Steve's Hub)" : kind === "text" && body === "Texted" ? "Texted (logged in Steve's Hub)" : body;
    const made: { id?: number } = await addFubNote(Number(p.fub_id), fubBody);
    if (made?.id) await supabase.from("notes").update({ fub_note_id: `note-${made.id}` }).eq("id", note.id);
  } catch {
    // Follow Up Boss unavailable: the note is still saved in the hub.
  }
}
