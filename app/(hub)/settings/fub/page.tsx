import Link from "next/link";
import { fetchAllPeople, fubConfigured, type FubPerson } from "@/lib/fub";
import { fubToFields, mapList, mapStage } from "@/lib/fubMap";
import { LISTS } from "@/lib/constants";
import { syncNow } from "@/app/fubActions";
import { SubmitButton } from "@/components/SubmitButton";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// A preview: what comes over from Follow Up Boss, and where it lands, before anything is saved.
export default async function FubPreview() {
  if (!fubConfigured()) {
    return <div className="card">The Follow Up Boss keys aren&apos;t in Vercel yet. <Link className="underline" href="/settings">Back to Settings</Link></div>;
  }
  let people: FubPerson[] = [];
  let problem: string | null = null;
  try {
    people = await fetchAllPeople();
  } catch (e) {
    problem = e instanceof Error ? e.message : String(e);
  }
  if (problem) {
    return (
      <div className="card space-y-3">
        <h1 className="h1">We couldn&apos;t reach Follow Up Boss</h1>
        <p className="text-stone-600">{problem}</p>
        <Link href="/settings" className="btn-light">Back to Settings</Link>
      </div>
    );
  }

  const rows = new Map<string, { fub: string; list: string; stage: string; count: number }>();
  const sources = new Map<string, { to: string; count: number }>();
  for (const p of people) {
    const list = mapList(p);
    const stage = mapStage(p.stage, list);
    const key = `${p.stage ?? "(no stage)"}|${list}|${stage}`;
    const r = rows.get(key) ?? { fub: p.stage ?? "(no stage)", list: LISTS[list].label, stage, count: 0 };
    r.count++;
    rows.set(key, r);
    const src = p.source ?? "(none)";
    const sr = sources.get(src) ?? { to: fubToFields(p).lead_source ?? "(none)", count: 0 };
    sr.count++;
    sources.set(src, sr);
  }
  const samples = people.slice(0, 5);

  return (
    <div className="space-y-6">
      <Link href="/settings" className="text-sm text-stone-500">← Back to Settings</Link>
      <h1 className="h1">Preview: your people from Follow Up Boss</h1>
      <p className="text-lg">Found <strong>{people.length}</strong> people. Nothing has been saved yet.</p>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">Where they&apos;ll go</h2>
        <table className="w-full text-left">
          <thead className="text-sm text-stone-500"><tr><th className="py-1">In Follow Up Boss</th><th>→ List in your hub</th><th>→ Stage</th><th className="text-right">People</th></tr></thead>
          <tbody>
            {[...rows.values()].sort((a, b) => b.count - a.count).map((r) => (
              <tr key={`${r.fub}${r.list}${r.stage}`} className="border-t border-stone-100"><td className="py-2">{r.fub}</td><td>{r.list}</td><td>{r.stage}</td><td className="text-right">{r.count}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-stone-500">Anyone tagged or sourced “Probate” goes to Probates, “Expired” goes to Expireds, everyone else to Clients. Tags come over as they are.</p>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">Lead sources</h2>
        <table className="w-full text-left">
          <thead className="text-sm text-stone-500"><tr><th className="py-1">In Follow Up Boss</th><th>→ In your hub</th><th className="text-right">People</th></tr></thead>
          <tbody>
            {[...sources.entries()].sort((a, b) => b[1].count - a[1].count).map(([from, v]) => (
              <tr key={from} className="border-t border-stone-100"><td className="py-2">{from}</td><td>{v.to}</td><td className="text-right">{v.count}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">A few examples</h2>
        <ul className="space-y-3">
          {samples.map((p) => {
            const f = fubToFields(p);
            const list = mapList(p);
            return (
              <li key={p.id} className="rounded-xl bg-stone-50 px-4 py-3">
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-stone-600">{[f.phone, f.email, f.address].filter(Boolean).join(" · ")}</p>
                <p className="text-sm text-stone-500">→ {LISTS[list].label} · {mapStage(p.stage, list)}{f.tags.length ? ` · Tags: ${f.tags.join(", ")}` : ""}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <form action={syncNow} className="card flex flex-col items-start gap-3 bg-amber-50">
        <p>If this looks right, bring them in. Anyone already in your hub with the same email or phone gets updated instead of doubled.</p>
        <SubmitButton className="btn-gold text-lg" pendingText="Bringing them over… (up to a minute)">✅ Looks right, bring them in</SubmitButton>
      </form>
    </div>
  );
}
