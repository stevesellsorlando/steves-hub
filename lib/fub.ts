// Talks to Follow Up Boss. Keys live in Vercel's Environment Variables, never in this code.
// Follow Up Boss is the "main" place for leads; the hub keeps a copy (one-way).

const BASE = "https://api.followupboss.com/v1";
// The system name Steve registered at apps.followupboss.com/system-registration
export const FUB_SYSTEM = process.env.FUB_SYSTEM || "StevesHub";

export function fubConfigured() {
  return Boolean(process.env.FUB_API_KEY && process.env.FUB_SYSTEM_KEY);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fubFetch<T = any>(pathOrUrl: string, init: RequestInit = {}): Promise<T> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : BASE + pathOrUrl;
  const auth = Buffer.from(`${process.env.FUB_API_KEY}:`).toString("base64");
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Basic ${auth}`,
        "X-System": FUB_SYSTEM,
        "X-System-Key": process.env.FUB_SYSTEM_KEY ?? "",
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 429) {
      // Follow Up Boss says "slow down": wait as long as it asks
      const wait = Number(res.headers.get("Retry-After") ?? "5");
      await sleep(Math.min(Math.max(wait, 1), 15) * 1000);
      continue;
    }
    if (res.status >= 500) {
      await sleep(4000 + Math.random() * 1000);
      continue;
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Follow Up Boss didn't accept the keys. Check FUB_API_KEY and FUB_SYSTEM_KEY in Vercel.");
    }
    if (!res.ok) throw new Error(`Follow Up Boss error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()) as T;
  }
  throw new Error("Follow Up Boss is busy right now. Please try again in a few minutes.");
}

export type FubPerson = {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  stage?: string;
  source?: string;
  tags?: string[];
  emails?: { value: string; type?: string; isPrimary?: boolean | number }[];
  phones?: { value: string; type?: string; isPrimary?: boolean | number }[];
  addresses?: { type?: string; street?: string; city?: string; state?: string; code?: string }[];
  background?: string;
  updated?: string;
  created?: string;
  lastActivity?: string;
};

type PeoplePage = { _metadata?: { next?: string | null; nextLink?: string | null }; people?: FubPerson[] };

// Every person Steve's key can see, 100 at a time
export async function fetchAllPeople(max = 20000): Promise<FubPerson[]> {
  const out: FubPerson[] = [];
  let url: string | null = `${BASE}/people?limit=100&fields=allFields`;
  while (url && out.length < max) {
    const page: PeoplePage = await fubFetch<PeoplePage>(url);
    const batch = page.people ?? [];
    out.push(...batch);
    const meta = page._metadata ?? {};
    if (meta.nextLink) url = meta.nextLink;
    else if (meta.next) url = `${BASE}/people?limit=100&fields=allFields&next=${encodeURIComponent(meta.next)}`;
    else url = null;
    if (!batch.length) url = null;
  }
  return out;
}

// Copies a hub note to the person's Follow Up Boss timeline
export async function addFubNote(fubPersonId: number, body: string): Promise<{ id?: number }> {
  return fubFetch("/notes", { method: "POST", body: JSON.stringify({ personId: fubPersonId, subject: "From Steve's Hub", body }) });
}

export type FubNote = { id: number; subject?: string; body?: string; isHtml?: boolean | number; created?: string };
export type FubCall = { id: number; note?: string; outcome?: string; duration?: number; isIncoming?: boolean | number; created?: string };

async function allPages<T>(firstUrl: string, keys: string | string[], max = 1000): Promise<T[]> {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const out: T[] = [];
  let url: string | null = firstUrl;
  while (url && out.length < max) {
    const page: any = await fubFetch(url);
    const found = keyList.find((k) => Array.isArray(page[k]));
    const batch: T[] = found ? page[found] : [];
    out.push(...batch);
    const meta = page._metadata ?? {};
    url = batch.length && meta.nextLink ? meta.nextLink : null;
  }
  return out;
}

export function fetchNotes(personId: number) {
  return allPages<FubNote>(`${BASE}/notes?personId=${personId}&limit=100`, "notes");
}

export function fetchCalls(personId: number) {
  return allPages<FubCall>(`${BASE}/calls?personId=${personId}&limit=100`, "calls");
}

export type FubText = { id: number; message?: string; isIncoming?: boolean | number; created?: string };
export type FubEvent = { id: number; type?: string; message?: string; description?: string; source?: string; created?: string; property?: { street?: string; city?: string } };

export function fetchTexts(personId: number) {
  return allPages<FubText>(`${BASE}/textMessages?personId=${personId}&limit=100`, ["textmessages", "textMessages"]);
}

export function fetchEvents(personId: number) {
  return allPages<FubEvent>(`${BASE}/events?personId=${personId}&limit=100`, "events");
}

export type FubRelationship = {
  id: number;
  type?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  emails?: { value: string }[];
  phones?: { value: string }[];
  addresses?: { street?: string; city?: string; state?: string; code?: string }[];
};

export function fetchRelationships(personId: number) {
  return allPages<FubRelationship>(`${BASE}/peopleRelationships?personId=${personId}&limit=100`, ["peoplerelationships", "peopleRelationships", "relationships"]);
}

export async function updateFubNote(fubNoteId: number, body: string) {
  return fubFetch(`/notes/${fubNoteId}`, { method: "PUT", body: JSON.stringify({ body }) });
}

// Sends a new lead to Follow Up Boss the recommended way (an "event"), so its lead rules and action plans run
export async function sendFubLead(lead: { firstName: string; lastName: string; email: string; phone: string; kind: "Buyer" | "Seller"; source: string; message: string }) {
  return fubFetch("/events", {
    method: "POST",
    body: JSON.stringify({
      source: `Steve's Hub Landing Page (${lead.source})`,
      system: FUB_SYSTEM,
      type: lead.kind === "Seller" ? "Seller Inquiry" : "General Inquiry",
      message: lead.message,
      person: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        emails: lead.email ? [{ value: lead.email }] : [],
        phones: lead.phone ? [{ value: lead.phone }] : [],
        tags: ["Landing page", lead.kind],
      },
    }),
  });
}
