import Link from "next/link";
import { EventList } from "@/components/EventList";
import { EventForm } from "@/components/EventForm";
import { addDaysISO, todayISO, TZ } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Start of a week (Sunday), shifted by `weeks`
function weekStart(weeks: number) {
  const today = todayISO();
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
  return addDaysISO(today, -dow + weeks * 7);
}

// Midnight in Orlando for a date, as an exact moment
function orlandoMidnight(iso: string) {
  const guess = new Date(`${iso}T05:00:00Z`);
  const hour = Number(guess.toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false })) % 24;
  return new Date(guess.getTime() - hour * 3600_000).toISOString();
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ w?: string; msg?: string }> }) {
  const { w, msg } = await searchParams;
  const weeks = Number(w) || 0;
  const start = weekStart(weeks);
  const end = addDaysISO(start, 14);
  const label = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="h1">📅 Calendar</h1>
          <div className="flex items-center gap-2">
            <Link href={`/calendar?w=${weeks - 1}`} className="btn-light px-3 py-2">←</Link>
            <Link href="/calendar" className="btn-light px-3 py-2">This week</Link>
            <Link href={`/calendar?w=${weeks + 1}`} className="btn-light px-3 py-2">→</Link>
          </div>
        </div>
        <p className="mb-4 text-stone-500">{label(start)} – {label(addDaysISO(end, -1))} · <Link className="underline" href="/settings">Choose which calendars show</Link></p>
        {msg && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">{msg}</div>}
        <EventList fromISO={orlandoMidnight(start)} toISO={orlandoMidnight(end)} emptyText="Nothing on your calendar these two weeks." />
      </section>
      <section className="card h-fit">
        <h2 className="mb-3 text-lg font-bold">+ Add event</h2>
        <EventForm />
      </section>
    </div>
  );
}
