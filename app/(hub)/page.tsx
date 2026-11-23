import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TaskRow } from "@/components/TaskRow";
import { OkBanner } from "@/components/OkBanner";
import { TZ, todayISO } from "@/lib/dates";
import type { Task } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const today = todayISO();
  const { data: due } = await supabase
    .from("tasks")
    .select("*, people(name, list, phone)")
    .is("done_at", null)
    .lte("due_date", today)
    .order("due_date")
    .returns<Task[]>();

  const hour = Number(new Date().toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false }));
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLine = new Date().toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">{hello}, Steve</h1>
        <p className="text-stone-500">{dateLine}</p>
      </div>

      <OkBanner />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/people/new?list=probate" className="btn-gold py-4">📜 Log a probate call</Link>
        <Link href="/people/new?list=expired" className="btn-gold py-4">🏚️ Log an expired call</Link>
        <Link href="/people/new?list=client" className="btn-dark py-4">👥 Add a client</Link>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Follow-ups due today {due?.length ? <span className="text-stone-400">({due.length})</span> : null}</h2>
          <Link href="/todo" className="text-sm text-gold-dark underline">See all to-dos</Link>
        </div>
        {due?.length ? (
          <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {due.slice(0, 10).map((t) => <TaskRow key={t.id} t={t} />)}
          </ul>
        ) : (
          <div className="card text-stone-500">You&apos;re all caught up. 🎉</div>
        )}
      </section>

      <section className="card border-dashed bg-transparent shadow-none">
        <h2 className="mb-1 font-bold">Coming soon to your homepage</h2>
        <p className="text-stone-500">Orlando weather · mortgage rates · real estate news and social media ideas · your active listings · this week&apos;s calendar, plus your morning “here&apos;s your day” email.</p>
      </section>
    </div>
  );
}
