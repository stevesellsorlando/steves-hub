// Steve works in Orlando, so "today" means today in Eastern time.
export const TZ = "America/New_York";

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function prettyDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
  return d.toLocaleDateString("en-US", {
    timeZone: iso.length === 10 ? "UTC" : TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function prettyDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dueLabel(iso: string): string {
  const today = todayISO();
  if (iso < today) return `Overdue (${prettyDate(iso)})`;
  if (iso === today) return "Today";
  if (iso === addDaysISO(today, 1)) return "Tomorrow";
  return prettyDate(iso);
}
