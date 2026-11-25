export const SIDE_MENU = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/clients", label: "Clients", icon: "👥" },
  { href: "/probates", label: "Probates", icon: "📜" },
  { href: "/expireds", label: "Expireds", icon: "🏚️" },
  { href: "/listings", label: "Listings", icon: "🏡" },
  { href: "/marketing", label: "Marketing", icon: "📣" },
  { href: "/bookkeeping", label: "Bookkeeping", icon: "💵" },
  { href: "/tracker", label: "Tracker", icon: "📈" },
  { href: "/more", label: "More", icon: "➕" },
];

export const PHONE_BAR = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/clients", label: "Clients", icon: "👥" },
  { href: "/probates", label: "Probates", icon: "📜" },
  { href: "/more", label: "More", icon: "➕" },
];

// Pages that are on the plan but not built yet. They show a friendly "coming soon" page.
export const COMING_SOON: Record<string, { label: string; icon: string; blurb: string }> = {
  listings: { label: "Listings", icon: "🏡", blurb: "One page per listing with house facts, notes, seller reports and your pipeline boards." },
  bookkeeping: { label: "Bookkeeping", icon: "💵", blurb: "Income from each closing, expenses with receipt photos, mileage, and CPA downloads." },
  tracker: { label: "Tracker", icon: "📈", blurb: "Calls, appointments and closings against your goals, plus your weekly review." },
  leads: { label: "Leads", icon: "📥", blurb: "A separate inbox for new online leads." },
  "open-houses": { label: "Open Houses", icon: "🪧", blurb: "A QR-code sign-in sheet that puts visitors right into your hub." },
  systems: { label: "Systems", icon: "🧭", blurb: "Your step-by-step checklists: new listing, under contract, closing." },
  growth: { label: "Growth", icon: "🌱", blurb: "Notes from classes and books, and your continuing education hours." },
  local: { label: "Local Know-How", icon: "📍", blurb: "Vendors, neighborhood notes, Market Watch, signs and lockboxes, business dates." },
  personal: { label: "Personal", icon: "🔒", blurb: "Your private to-dos, grocery list, bills and gift list." },
};
