// How Follow Up Boss people turn into hub cards, in Steve's words.
import { CLIENT_STAGES, type ListKey } from "./constants";
import type { FubPerson } from "./fub";

const lc = (s?: string | null) => (s ?? "").trim().toLowerCase();

const CLIENTISH = ["active client", "pending", "under contract", "closed", "past client"];

export function mapList(p: FubPerson): ListKey {
  if (CLIENTISH.includes(lc(p.stage))) return "client";
  const words = [...(p.tags ?? []), p.source ?? ""].map(lc).join(" | ");
  if (words.includes("probate")) return "probate";
  if (words.includes("expired")) return "expired";
  return "client";
}

export function mapStage(fubStage: string | undefined, list: ListKey): string {
  const s = lc(fubStage);
  if (list === "client") {
    const exact = CLIENT_STAGES.find((c) => lc(c) === s);
    if (exact) return exact;
    if (s === "under contract") return "Pending";
    if (s.includes("hot")) return "Hot Prospect";
    if (s === "buyer" || s === "seller" || s.includes("active")) return "Active Client";
    if (s.includes("nurture") || s.includes("warm") || s.includes("cold")) return "Nurture";
    if (s.includes("past")) return "Past Client";
    if (s === "rejected" || s === "archive" || s === "trash") return "Trash";
    return "Lead";
  }
  // Probates and Expireds use the short calling stages
  if (s === "trash" || s === "rejected" || s === "archive") return "Not Interested";
  if (s.includes("hot") || s.includes("nurture") || s.includes("contacted") || s.includes("warm")) return "Talked To";
  if (s.includes("appointment")) return "Appointment Set";
  return "New";
}

export function mapSource(src?: string): string | null {
  const s = lc(src);
  if (!s) return null;
  if (s.includes("probate")) return "Probate";
  if (s.includes("expired")) return "Expired listing";
  if (s.includes("zillow") || s.includes("realtor.com")) return "Zillow / Realtor.com";
  if (s.includes("sign")) return "Sign call";
  if (s.includes("referr")) return "Referral";
  if (s.includes("sphere")) return "Sphere";
  if (s.includes("past client")) return "Past client";
  if (s.includes("open house")) return "Open house";
  return src!.trim();
}

const primaryFirst = <T extends { isPrimary?: boolean | number }>(xs?: T[]) =>
  [...(xs ?? [])].sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));

export function fubToFields(p: FubPerson) {
  const phones = primaryFirst(p.phones).map((x) => x.value).filter(Boolean);
  const emails = primaryFirst(p.emails).map((x) => x.value).filter(Boolean);
  const a = p.addresses?.[0];
  const address = a ? formatAddress(a) : null;
  const name = (p.name || [p.firstName, p.lastName].filter(Boolean).join(" ")).trim() || `Follow Up Boss #${p.id}`;
  const labeled = {
    phones: primaryFirst(p.phones).filter((x) => x.value).map((x) => ({ value: x.value, label: x.type ?? null })),
    emails: primaryFirst(p.emails).filter((x) => x.value).map((x) => ({ value: x.value, label: x.type ?? null })),
    addresses: (p.addresses ?? [])
      .map((x) => ({ value: formatAddress(x), label: x.type ?? null }))
      .filter((x) => x.value),
  };
  return {
    name,
    phones: labeled.phones.length ? labeled.phones : null,
    emails: labeled.emails.length ? labeled.emails : null,
    addresses: labeled.addresses.length ? labeled.addresses : null,
    phone: phones[0] ?? null,
    phone2: phones[1] ?? null,
    email: emails[0] ?? null,
    email2: emails[1] ?? null,
    address: address || null,
    tags: (p.tags ?? []).filter(Boolean),
    lead_source: mapSource(p.source),
  };
}

export const digits = (s?: string | null) => (s ?? "").replace(/\D/g, "").slice(-10);

export function formatAddress(a: { street?: string; city?: string; state?: string; code?: string }) {
  return [a.street, a.city, [a.state, a.code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}
