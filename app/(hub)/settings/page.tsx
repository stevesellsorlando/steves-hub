import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { syncNow } from "@/app/fubActions";
import { SubmitButton } from "@/components/SubmitButton";
import { prettyDateTime } from "@/lib/dates";
import { NotesImporter } from "@/components/NotesImporter";
import { notesWaiting } from "@/lib/fubNotes";
import { googleConfigured, googleKeyCheck } from "@/lib/google";
import { testEmailToMe } from "@/app/emailActions";
import { saveShownCalendars } from "@/app/calendarActions";
import { calendarToken, listCalendars, type Cal } from "@/lib/calendar";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const KEYS = [
  { name: "FUB_API_KEY", what: "Your Follow Up Boss API key" },
  { name: "FUB_SYSTEM_KEY", what: "Your hub's Follow Up Boss system key" },
  { name: "SUPABASE_SECRET_KEY", what: "Lets the daily catch-up run while you're away" },
  { name: "CRON_SECRET", what: "A made-up password for the daily catch-up" },
];

export default async function Settings({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const supabase = await createClient();
  const { data: s } = await supabase.from("app_settings").select("*").maybeSingle();
  const have = Object.fromEntries(KEYS.map((k) => [k.name, Boolean(process.env[k.name])]));
  const ready = have.FUB_API_KEY && have.FUB_SYSTEM_KEY;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ count: linked }, waiting] = await Promise.all([
    supabase.from("people").select("id", { count: "exact", head: true }).not("fub_id", "is", null),
    user ? notesWaiting(supabase, user.id) : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="h1">⚙️ Settings</h1>
      {msg && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">{msg}</div>}

      <GoogleCard />

      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Follow Up Boss</h2>
        <p className="text-stone-600">
          Follow Up Boss stays your main place for leads. Your hub keeps a copy that updates itself once a day (early morning), or anytime you tap “Sync now.”
        </p>

        <div>
          <p className="label">Keys in Vercel</p>
          <ul className="space-y-1">
            {KEYS.map((k) => (
              <li key={k.name} className="text-sm">
                {have[k.name] ? "✅" : "⬜"} <code className="rounded bg-stone-100 px-1">{k.name}</code> <span className="text-stone-500">· {k.what}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-stone-700">
          <strong>Follow Up Boss: last synced</strong>{" "}
          {s?.fub_last_synced_at ? prettyDateTime(s.fub_last_synced_at) : "never"}
          {s?.fub_last_result && <span className="block text-sm text-stone-500">{s.fub_last_result}</span>}
        </p>

        {ready ? (
          s?.fub_sync_enabled ? (
            <div className="flex flex-wrap gap-3">
              <form action={syncNow}><SubmitButton pendingText="Syncing… (up to a minute)">🔄 Sync now</SubmitButton></form>
              <Link href="/settings/fub" className="btn-light">See the mapping</Link>
            </div>
          ) : (
            <Link href="/settings/fub" className="btn-gold">Preview what will come over</Link>
          )
        ) : (
          <p className="rounded-xl bg-stone-50 px-4 py-3 text-stone-600">Add the two Follow Up Boss keys in Vercel to turn this on.</p>
        )}
      </section>

      {ready && s?.fub_sync_enabled && (
        <section className="card space-y-3">
          <h2 className="text-lg font-bold">📝 Notes from Follow Up Boss</h2>
          <p className="text-stone-600">
            Copies each person&apos;s notes, calls, texts and history onto their timeline, with the original dates. New notes come over each morning on their own.
          </p>
          <NotesImporter waiting={waiting ?? 0} total={linked ?? 0} />
        </section>
      )}
    </div>
  );
}

async function GoogleCard() {
  const supabase = await createClient();
  const { data: g } = await supabase.from("google_accounts").select("email, connected_at, refresh_token").maybeSingle();
  const connected = Boolean(g?.refresh_token);
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-bold">Google email &amp; calendar</h2>
      {!googleConfigured() ? (
        <p className="rounded-xl bg-stone-50 px-4 py-3 text-stone-600">Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel to turn this on.</p>
      ) : connected ? (
        <>
          <p className="text-stone-700">
            ✅ Connected as <strong>{g?.email}</strong>
            {g?.connected_at && <span className="block text-sm text-stone-500">Since {prettyDateTime(g.connected_at)}</span>}
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={testEmailToMe}><SubmitButton>✉️ Send a test email to myself</SubmitButton></form>
            <a href="/api/google/start" className="btn-light">Reconnect Google</a>
          </div>
          <CalendarPicker />
        </>
      ) : (
        <>
          <p className="text-stone-600">Connect your Google account so emails you approve send from your real address, and so your hub can use your calendar.</p>
          <a href="/api/google/start" className="btn-gold">Connect Google</a>
          <KeyCheck />
        </>
      )}
    </section>
  );
}

function KeyCheck() {
  const k = googleKeyCheck();
  return (
    <details className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
      <summary className="cursor-pointer font-semibold">Key check (for troubleshooting)</summary>
      <ul className="mt-2 space-y-1">
        <li>{k.idLooksRight ? "✅" : "⚠️"} Client ID ends with: …{k.idEnd}</li>
        <li>
          {k.secretStart === "GOCSPX-" ? "✅" : "⚠️"} Client secret starts with “{k.secretStart}”, ends with “{k.secretEnd}”, {k.secretLength} characters long
          {k.hadExtraSpaces ? " (extra spaces removed)" : ""}
        </li>
      </ul>
    </details>
  );
}

async function CalendarPicker() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  let cals: Cal[] = [];
  try {
    cals = await listCalendars(await calendarToken(supabase, user.id));
  } catch {
    return <p className="text-sm text-stone-500">Couldn&apos;t load your calendars. Try “Reconnect Google.”</p>;
  }
  const { data: g } = await supabase.from("google_accounts").select("shown_calendars").maybeSingle();
  const picked: string[] | null = g?.shown_calendars ?? null;
  return (
    <form action={saveShownCalendars} className="space-y-2 rounded-xl bg-stone-50 px-4 py-3">
      <p className="font-semibold">📅 Calendars to show in your hub</p>
      {cals.map((c) => (
        <label key={c.id} className="flex items-center gap-3">
          <input type="checkbox" name="cal" value={c.id} defaultChecked={picked ? picked.includes(c.id) : c.primary} className="h-5 w-5 accent-[#c9a24a]" />
          <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
          <span>{c.name}{c.primary ? " (your main calendar)" : ""}</span>
        </label>
      ))}
      <SubmitButton className="btn-gold px-4 py-2">Save calendars</SubmitButton>
      <p className="text-sm text-stone-500">New events you add from the hub go on your main calendar.</p>
    </form>
  );
}
