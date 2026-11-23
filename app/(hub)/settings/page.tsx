import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { syncNow } from "@/app/fubActions";
import { SubmitButton } from "@/components/SubmitButton";
import { prettyDateTime } from "@/lib/dates";
import { NotesImporter } from "@/components/NotesImporter";

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
  const [{ count: linked }, { count: waiting }] = await Promise.all([
    supabase.from("people").select("id", { count: "exact", head: true }).not("fub_id", "is", null),
    supabase.from("people").select("id", { count: "exact", head: true }).not("fub_id", "is", null).is("fub_notes_synced_at", null),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="h1">⚙️ Settings</h1>
      {msg && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">{msg}</div>}

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
            Copies each person&apos;s notes and call logs onto their timeline, with the original dates. New notes come over each morning on their own.
          </p>
          <NotesImporter waiting={waiting ?? 0} total={linked ?? 0} />
        </section>
      )}
    </div>
  );
}
