import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calendarToken, eventsBetween, shownCalendars, type CalEvent } from "@/lib/calendar";
import { GoogleNotConnected } from "@/lib/google";
import { TZ, todayISO } from "@/lib/dates";

const dayKey = (e: CalEvent) => (e.allDay ? e.start : new Date(e.start).toLocaleDateString("en-CA", { timeZone: TZ }));
const timeOf = (e: CalEvent) =>
  e.allDay ? "All day" : new Date(e.start).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

// Events from the calendars Steve picked, grouped by day
export async function EventList({ fromISO, toISO, emptyText = "Nothing on your calendar." }: { fromISO: string; toISO: string; emptyText?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  let events: CalEvent[] = [];
  let cals: { name: string; color: string }[] = [];
  try {
    const token = await calendarToken(supabase, user.id);
    const shown = await shownCalendars(supabase, user.id, token);
    cals = shown;
    events = await eventsBetween(token, shown, fromISO, toISO);
  } catch (e) {
    return (
      <p className="text-stone-500">
        {e instanceof GoogleNotConnected ? <>Connect Google in <Link className="underline" href="/settings">Settings</Link> to see your calendar.</> : "Couldn't load your calendar right now. Refresh in a moment."}
      </p>
    );
  }
  const days = new Map<string, CalEvent[]>();
  for (const e of events) days.set(dayKey(e), [...(days.get(dayKey(e)) ?? []), e]);
  const today = todayISO();
  return (
    <div className="space-y-4">
      {cals.length > 1 && (
        <div className="flex flex-wrap gap-3 text-sm text-stone-600">
          {cals.map((c) => (
            <span key={c.name} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: c.color }} />{c.name}</span>
          ))}
        </div>
      )}
      {!events.length && <p className="text-stone-500">{emptyText}</p>}
      {[...days.entries()].map(([day, list]) => (
        <div key={day}>
          <p className={`mb-1 text-sm font-bold ${day === today ? "text-gold-dark" : "text-stone-600"}`}>
            {day === today ? "Today · " : ""}
            {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" })}
          </p>
          <ul className="space-y-1.5">
            {list.map((e) => (
              <li key={`${e.calendarId}-${e.id}`} className="flex items-start gap-3 rounded-xl bg-stone-50 px-3 py-2">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: e.color }} title={e.calendarName} />
                <span className="w-20 shrink-0 text-sm text-stone-500">{timeOf(e)}</span>
                <span className="min-w-0">
                  {e.link ? <a href={e.link} target="_blank" rel="noreferrer" className="font-medium hover:text-gold-dark">{e.title}</a> : <span className="font-medium">{e.title}</span>}
                  {e.location && <span className="block truncate text-sm text-stone-500">📍 {e.location}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
