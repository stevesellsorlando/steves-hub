import type { Labeled, Person } from "./types";

const norm = (v: string) => v.replace(/[^a-z0-9]/gi, "").toLowerCase();

// Labeled entries (from Follow Up Boss or edits), plus anything typed into the card's own fields
export function merged(list: Labeled[] | null | undefined, fallback: (string | null)[]): Labeled[] {
  const out = [...(list ?? [])];
  for (const v of fallback) if (v && !out.some((o) => norm(o.value) === norm(v))) out.push({ value: v, label: null });
  return out;
}

export type ContactKind = "phones" | "emails" | "addresses";

export function contactList(p: Person, kind: ContactKind): Labeled[] {
  if (kind === "phones") return merged(p.phones, [p.phone, p.phone2]);
  if (kind === "emails") return merged(p.emails, [p.email, p.email2]);
  return merged(p.addresses, [p.address]);
}

// After editing a list, keep the simple fields (used by search and older pages) in step
export function flatFields(kind: ContactKind, list: Labeled[]) {
  if (kind === "phones") return { phones: list, phone: list[0]?.value ?? null, phone2: list[1]?.value ?? null };
  if (kind === "emails") return { emails: list, email: list[0]?.value ?? null, email2: list[1]?.value ?? null };
  return { addresses: list, address: list[0]?.value ?? null };
}
