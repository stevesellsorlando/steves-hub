// Steve's words for everything. Change names here and they change across the hub.

export type ListKey = "client" | "probate" | "expired";

export const LISTS: Record<ListKey, { label: string; one: string; path: string; taskType: string }> = {
  client: { label: "Clients", one: "Client", path: "/clients", taskType: "Client" },
  probate: { label: "Probates", one: "Probate", path: "/probates", taskType: "Probate" },
  expired: { label: "Expireds", one: "Expired", path: "/expireds", taskType: "Expired" },
};

export function isListKey(v: string | undefined | null): v is ListKey {
  return v === "client" || v === "probate" || v === "expired";
}

export const CLIENT_STAGES = [
  "Lead",
  "Hot Prospect",
  "Nurture",
  "Active Client",
  "Pending",
  "Closed",
  "Past Client",
  "Sphere",
  "Trash",
];

export const CALL_LIST_STAGES = [
  "New",
  "Attempted",
  "Talked To",
  "Appointment Set",
  "Not Interested",
  "Became a Client",
];

export function stagesFor(list: ListKey) {
  return list === "client" ? CLIENT_STAGES : CALL_LIST_STAGES;
}

export function defaultStage(list: ListKey) {
  return list === "client" ? "Lead" : "New";
}

export const LEAD_SOURCES = [
  "Probate",
  "Expired listing",
  "Sign call",
  "Referral",
  "Sphere",
  "Past client",
  "Open house",
  "Zillow / Realtor.com",
  "My website or social media",
  "Royalty Real Estate Boutique",
  "Landing page",
  "Facebook ad",
  "Instagram ad",
  "QR code",
];

// Where a landing-page visitor came from (?src=...)
export function sourceFromParam(src?: string | null): string {
  const s = (src ?? "").toLowerCase();
  if (s.startsWith("fb") || s.includes("facebook")) return "Facebook ad";
  if (s.startsWith("ig") || s.includes("instagram")) return "Instagram ad";
  if (s.includes("qr")) return "QR code";
  return "Landing page";
}

export function defaultSource(list: ListKey) {
  return list === "probate" ? "Probate" : list === "expired" ? "Expired listing" : "";
}

export const DAY_ONE_TAGS = [
  "Sphere / Friends & Family",
  "Investor",
  "Executor",
  "Vacant Property",
  "Needs Repairs / As-Is",
  "Out of State Owner",
  "Referral Source",
  "Vendor",
];

export const TASK_TYPES = ["Probate", "Expired", "Client", "Listing", "Personal", "Other"];

export const FOLLOW_UPS = [
  { key: "1d", label: "1 day", days: 1 },
  { key: "3d", label: "3 days", days: 3 },
  { key: "1w", label: "1 week", days: 7 },
  { key: "2w", label: "2 weeks", days: 14 },
  { key: "1m", label: "1 month", days: 30 },
];

export const QUICK_LINKS = [
  { label: "Stellar MLS", href: "https://www.stellarmls.com/" },
  { label: "Form Simplicity", href: "https://www.formsimplicity.com/" },
  { label: "ShowingTime", href: "https://www.showingtime.com/" },
  { label: "Property Appraiser", href: "https://www.ocpafl.org/" },
];
