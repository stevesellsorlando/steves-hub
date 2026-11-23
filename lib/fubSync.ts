// One-way sync: Follow Up Boss -> Steve's Hub.
// Matches people by Follow Up Boss ID, then email, then phone, so nobody gets doubled.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllPeople, type FubPerson } from "./fub";
import { digits, fubToFields, mapList, mapStage } from "./fubMap";

type Existing = {
  id: string;
  fub_id: number | null;
  fub_stage: string | null;
  list: string;
  name: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  email2: string | null;
  address: string | null;
  tags: string[] | null;
  lead_source: string | null;
};

export type SyncResult = { total: number; created: number; updated: number; unchanged: number };

export async function syncFromFub(supabase: SupabaseClient, userId: string, people?: FubPerson[]): Promise<SyncResult> {
  const fubPeople = people ?? (await fetchAllPeople());

  const { data: existingRows, error } = await supabase
    .from("people")
    .select("id, fub_id, fub_stage, list, name, phone, phone2, email, email2, address, tags, lead_source")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const existing = (existingRows ?? []) as Existing[];

  const byFub = new Map<number, Existing>();
  const byEmail = new Map<string, Existing>();
  const byPhone = new Map<string, Existing>();
  for (const e of existing) {
    if (e.fub_id) byFub.set(Number(e.fub_id), e);
    for (const em of [e.email, e.email2]) if (em) byEmail.set(em.toLowerCase(), e);
    for (const ph of [e.phone, e.phone2]) if (digits(ph).length >= 7) byPhone.set(digits(ph), e);
  }

  const result: SyncResult = { total: fubPeople.length, created: 0, updated: 0, unchanged: 0 };
  const inserts: Record<string, unknown>[] = [];
  const notes: { fubId: number; body: string }[] = [];
  const claimed = new Set<string>();

  for (const p of fubPeople) {
    const f = fubToFields(p);
    let match = byFub.get(p.id);
    if (!match) {
      const em = [f.email, f.email2].find((x) => x && byEmail.get(x.toLowerCase()));
      if (em) match = byEmail.get(em.toLowerCase());
    }
    if (!match) {
      const ph = [f.phone, f.phone2].find((x) => digits(x).length >= 7 && byPhone.get(digits(x)));
      if (ph) match = byPhone.get(digits(ph));
    }
    if (match && (claimed.has(match.id) || (match.fub_id && Number(match.fub_id) !== p.id))) match = undefined;

    if (!match) {
      const list = mapList(p);
      inserts.push({
        user_id: userId,
        list,
        stage: mapStage(p.stage, list),
        fub_id: p.id,
        fub_stage: p.stage ?? null,
        fub_updated_at: p.updated ?? null,
        ...f,
      });
      if (p.background?.trim()) notes.push({ fubId: p.id, body: `From Follow Up Boss: ${p.background.trim()}` });
      continue;
    }

    claimed.add(match.id);
    // Follow Up Boss is the main copy for contact info; keep any tags added in the hub too.
    const tags = Array.from(new Set([...(match.tags ?? []), ...f.tags]));
    const patch: Record<string, unknown> = {};
    const set = (k: keyof Existing, v: unknown) => {
      if (v !== null && v !== undefined && v !== "" && JSON.stringify(match![k]) !== JSON.stringify(v)) patch[k] = v;
    };
    set("name", f.name);
    set("phone", f.phone);
    set("phone2", f.phone2);
    set("email", f.email);
    set("email2", f.email2);
    set("address", f.address);
    set("lead_source", f.lead_source);
    if (tags.length !== (match.tags ?? []).length) patch.tags = tags;
    if (!match.fub_id) patch.fub_id = p.id;
    // Only change the hub stage when the stage changed in Follow Up Boss, so Steve's own hub changes stick.
    if ((p.stage ?? null) !== match.fub_stage) {
      patch.fub_stage = p.stage ?? null;
      patch.stage = mapStage(p.stage, match.list as never);
    }
    if (Object.keys(patch).length) {
      patch.fub_updated_at = p.updated ?? null;
      const { error: upErr } = await supabase.from("people").update(patch).eq("id", match.id).eq("user_id", userId);
      if (upErr) throw new Error(upErr.message);
      result.updated++;
    } else result.unchanged++;
  }

  for (let i = 0; i < inserts.length; i += 200) {
    const chunk = inserts.slice(i, i + 200);
    const { data: made, error: insErr } = await supabase.from("people").insert(chunk).select("id, fub_id");
    if (insErr) throw new Error(insErr.message);
    result.created += made?.length ?? 0;
    const idByFub = new Map((made ?? []).map((m) => [Number(m.fub_id), m.id as string]));
    const noteRows = notes
      .filter((n) => idByFub.has(n.fubId))
      .map((n) => ({ user_id: userId, person_id: idByFub.get(n.fubId), kind: "note", body: n.body }));
    if (noteRows.length) await supabase.from("notes").insert(noteRows);
  }

  await supabase.from("app_settings").upsert({
    user_id: userId,
    fub_sync_enabled: true,
    fub_last_synced_at: new Date().toISOString(),
    fub_last_result: `${result.total} people checked: ${result.created} new, ${result.updated} updated, ${result.unchanged} unchanged`,
    updated_at: new Date().toISOString(),
  });
  return result;
}
