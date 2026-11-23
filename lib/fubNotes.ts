// Brings each person's Follow Up Boss notes and call logs onto their hub timeline.
// Works in batches and remembers where it left off, so it can stop and resume anytime.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCalls, fetchEvents, fetchNotes, fetchTexts, type FubCall, type FubEvent, type FubNote, type FubText } from "./fub";

// Anyone whose notes were brought over before texts and history were added gets one more pass.
const FORMAT_SINCE = "2026-11-23T16:20:00Z";
const WAITING = `fub_notes_synced_at.is.null,fub_notes_synced_at.lt.${FORMAT_SINCE}`;

const strip = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function noteRow(userId: string, personId: string, n: FubNote) {
  const text = n.isHtml ? strip(n.body ?? "") : (n.body ?? "").trim();
  const body = [n.subject?.trim(), text].filter(Boolean).join("\n");
  if (!body) return null;
  return { user_id: userId, person_id: personId, kind: "note", body, created_at: n.created ?? new Date().toISOString(), fub_note_id: `note-${n.id}` };
}

function callRow(userId: string, personId: string, c: FubCall) {
  const mins = c.duration ? ` (${Math.max(1, Math.round(c.duration / 60))} min)` : "";
  const head = `${c.isIncoming ? "Incoming call" : "Called"}${c.outcome ? `: ${c.outcome}` : ""}${mins}`;
  const body = [head, c.note?.trim()].filter(Boolean).join("\n");
  return { user_id: userId, person_id: personId, kind: "call", body, created_at: c.created ?? new Date().toISOString(), fub_note_id: `call-${c.id}` };
}

function textRow(userId: string, personId: string, t: FubText) {
  const body = `${t.isIncoming ? "Text from them" : "Texted"}: ${(t.message ?? "").trim() || "(no text shown)"}`;
  return { user_id: userId, person_id: personId, kind: "text", body, created_at: t.created ?? new Date().toISOString(), fub_note_id: `text-${t.id}` };
}

function eventRow(userId: string, personId: string, e: FubEvent) {
  const place = e.property?.street ? ` · ${[e.property.street, e.property.city].filter(Boolean).join(", ")}` : "";
  const what = [e.type, e.source ? `from ${e.source}` : ""].filter(Boolean).join(" ");
  const body = [`History: ${what || "Activity"}${place}`, (e.message || e.description || "").trim()].filter(Boolean).join("\n");
  return { user_id: userId, person_id: personId, kind: "note", body, created_at: e.created ?? new Date().toISOString(), fub_note_id: `event-${e.id}` };
}

export async function notesWaiting(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("people")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("fub_id", "is", null)
    .or(WAITING);
  return count ?? 0;
}

// Runs for up to `budgetMs`, then stops. Returns how many people are still waiting.
export async function importNotesBatch(supabase: SupabaseClient, userId: string, budgetMs = 40000) {
  const started = Date.now();
  let done = 0;
  let notesAdded = 0;
  while (Date.now() - started < budgetMs) {
    const { data: batch, error } = await supabase
      .from("people")
      .select("id, fub_id")
      .eq("user_id", userId)
      .not("fub_id", "is", null)
      .or(WAITING)
      .order("fub_last_activity", { ascending: false, nullsFirst: false })
      .limit(8);
    if (error) throw new Error(error.message);
    if (!batch?.length) break;

    // A few at a time, gently, so Follow Up Boss doesn't ask us to slow down
    for (let i = 0; i < batch.length && Date.now() - started < budgetMs; i += 4) {
      const group = batch.slice(i, i + 4);
      await Promise.all(
        group.map(async (p) => {
          const id = Number(p.fub_id);
          // Texts and history are extras: if Follow Up Boss won't share them, keep going with notes and calls.
          const [notes, calls, texts, events] = await Promise.all([
            fetchNotes(id),
            fetchCalls(id),
            fetchTexts(id).catch(() => []),
            fetchEvents(id).catch(() => []),
          ]);
          const rows = [
            ...notes.map((n) => noteRow(userId, p.id, n)).filter(Boolean),
            ...calls.map((c) => callRow(userId, p.id, c)),
            ...texts.map((t) => textRow(userId, p.id, t)),
            ...events.map((e) => eventRow(userId, p.id, e)),
          ] as Record<string, unknown>[];
          if (rows.length) {
            const { error: insErr } = await supabase
              .from("notes")
              .upsert(rows, { onConflict: "user_id,fub_note_id", ignoreDuplicates: true });
            if (insErr) throw new Error(insErr.message);
            notesAdded += rows.length;
          }
          await supabase.from("people").update({ fub_notes_synced_at: new Date().toISOString() }).eq("id", p.id);
          done++;
        }),
      );
    }
  }
  return { done, notesAdded, remaining: await notesWaiting(supabase, userId) };
}
