// Google Calendar for Steve: list his calendars, show events, add events.
import type { SupabaseClient } from "@supabase/supabase-js";
import { accessToken } from "./google";
import { TZ } from "./dates";

async function gcal<T = any>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Google Calendar error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export type Cal = { id: string; name: string; color: string; primary: boolean };
export type CalEvent = { id: string; calendarId: string; calendarName: string; color: string; title: string; start: string; end: string; allDay: boolean; location?: string; link?: string };

export async function listCalendars(token: string): Promise<Cal[]> {
  const r = await gcal<{ items?: any[] }>(token, "/users/me/calendarList?minAccessRole=reader");
  return (r.items ?? []).map((c) => ({
    id: c.id,
    name: c.summaryOverride || c.summary || c.id,
    color: c.backgroundColor || "#c9a24a",
    primary: Boolean(c.primary),
  }));
}

// The calendars Steve picked in Settings (his main one if he hasn't picked yet)
export async function shownCalendars(supabase: SupabaseClient, userId: string, token: string): Promise<Cal[]> {
  const { data } = await supabase.from("google_accounts").select("shown_calendars").eq("user_id", userId).maybeSingle();
  const all = await listCalendars(token);
  const picked: string[] | null = data?.shown_calendars ?? null;
  return picked ? all.filter((c) => picked.includes(c.id)) : all.filter((c) => c.primary);
}

export async function eventsBetween(token: string, cals: Cal[], fromISO: string, toISO: string): Promise<CalEvent[]> {
  const lists = await Promise.all(
    cals.map(async (c) => {
      const q = new URLSearchParams({ timeMin: fromISO, timeMax: toISO, singleEvents: "true", orderBy: "startTime", maxResults: "250", timeZone: TZ });
      try {
        const r = await gcal<{ items?: any[] }>(token, `/calendars/${encodeURIComponent(c.id)}/events?${q}`);
        return (r.items ?? [])
          .filter((e) => e.status !== "cancelled")
          .map(
            (e): CalEvent => ({
              id: e.id,
              calendarId: c.id,
              calendarName: c.name,
              color: c.color,
              title: e.summary || "(no title)",
              start: e.start?.dateTime ?? e.start?.date,
              end: e.end?.dateTime ?? e.end?.date,
              allDay: Boolean(e.start?.date),
              location: e.location,
              link: e.htmlLink,
            }),
          );
      } catch {
        return [];
      }
    }),
  );
  return lists.flat().sort((a, b) => a.start.localeCompare(b.start));
}

// Adds an event to Steve's main calendar, with a reminder 30 minutes before
export async function addEvent(token: string, e: { title: string; date: string; time?: string | null; minutes?: number; location?: string | null; notes?: string | null }) {
  const body: Record<string, unknown> = {
    summary: e.title,
    location: e.location || undefined,
    description: e.notes || undefined,
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
  };
  if (e.time) {
    const start = `${e.date}T${e.time}:00`;
    const endDate = new Date(`${start}Z`);
    endDate.setUTCMinutes(endDate.getUTCMinutes() + (e.minutes ?? 60));
    const end = endDate.toISOString().slice(0, 19);
    body.start = { dateTime: start, timeZone: TZ };
    body.end = { dateTime: end, timeZone: TZ };
  } else {
    const next = new Date(`${e.date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    body.start = { date: e.date };
    body.end = { date: next.toISOString().slice(0, 10) };
  }
  return gcal<{ id: string; htmlLink: string }>(token, "/calendars/primary/events", { method: "POST", body: JSON.stringify(body) });
}

export async function calendarToken(supabase: SupabaseClient, userId: string) {
  return (await accessToken(supabase, userId)).token;
}
