import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fubConfigured } from "@/lib/fub";
import { syncFromFub } from "@/lib/fubSync";
import { importNotesBatch } from "@/lib/fubNotes";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Vercel calls this once a day (see vercel.json). It only runs with the CRON_SECRET Vercel sends.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  if (!fubConfigured()) return NextResponse.json({ skipped: "Follow Up Boss keys not set" });

  const admin = createAdminClient();
  const { data: owners } = await admin.from("app_settings").select("user_id").eq("fub_sync_enabled", true);
  const started = Date.now();
  const results = [];
  for (const o of owners ?? []) {
    try {
      const people = await syncFromFub(admin, o.user_id);
      // Use the time left to bring over new notes and calls
      const left = 50000 - (Date.now() - started);
      const notes = left > 5000 ? await importNotesBatch(admin, o.user_id, left) : null;
      results.push({ ok: true, ...people, notes });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("app_settings").update({ fub_last_result: `Daily catch-up failed: ${msg}` }).eq("user_id", o.user_id);
      results.push({ ok: false, error: msg });
    }
  }
  return NextResponse.json({ results });
}
