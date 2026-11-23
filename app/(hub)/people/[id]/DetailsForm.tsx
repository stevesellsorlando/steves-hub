import { updatePerson } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { DAY_ONE_TAGS, LEAD_SOURCES } from "@/lib/constants";
import type { Person } from "@/lib/types";

type Field = { name: keyof Person; label: string; type?: "text" | "date" | "tel" | "email"; options?: string[] };

function F({ f, p }: { f: Field; p: Person }) {
  const value = (p[f.name] as string | null) ?? "";
  return (
    <div>
      <label className="label" htmlFor={`d-${f.name}`}>{f.label}</label>
      {f.options ? (
        <select id={`d-${f.name}`} name={f.name} defaultValue={value} className="input">
          <option value="">—</option>
          {value && !f.options.includes(value) && <option>{value}</option>}
          {f.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input id={`d-${f.name}`} name={f.name} type={f.type ?? "text"} defaultValue={value} className="input" />
      )}
    </div>
  );
}

function Section({ title, fields, p }: { title: string; fields: Field[]; p: Person }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-base font-bold text-gold-dark">{title}</legend>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => <F key={f.name} f={f} p={p} />)}
      </div>
    </fieldset>
  );
}

export function DetailsForm({ person: p }: { person: Person }) {
  const contact: Field[] = [
    { name: "name", label: "Name (couples: “Mike & Lisa Garcia”)" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "phone2", label: "Second phone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "email2", label: "Second email", type: "email" },
    { name: "address", label: "Home / mailing address" },
    { name: "best_time_to_call", label: "Best time to call" },
    { name: "preferred_contact", label: "Preferred way to reach them", options: ["Call", "Text", "Email"] },
    { name: "social_media", label: "Social media" },
    { name: "lead_source", label: "Lead source", options: LEAD_SOURCES },
  ];
  const probate: Field[] = [
    { name: "property_address", label: "Property address" },
    { name: "deceased_name", label: "Name of the deceased" },
    { name: "relationship", label: "Who they are", options: ["Executor / Personal Representative", "Heir", "Family member", "Attorney", "Other"] },
    { name: "attorney_name", label: "Probate attorney" },
    { name: "attorney_phone", label: "Attorney phone", type: "tel" },
    { name: "case_number", label: "Case number" },
    { name: "date_filed", label: "Date filed", type: "date" },
  ];
  const expired: Field[] = [
    { name: "property_address", label: "Property address" },
    { name: "mls_number", label: "MLS number" },
    { name: "list_price", label: "Last list price" },
    { name: "expired_date", label: "Expired on", type: "date" },
    { name: "previous_agent", label: "Previous agent / brokerage" },
  ];
  const deal: Field[] = [
    { name: "buyer_seller", label: "Buyer or seller", options: ["Seller", "Buyer", "Both"] },
    { name: "agreement", label: "Agreement", options: ["Signed", "Verbal", "Not yet"] },
    { name: "closing_date", label: "Closing date", type: "date" },
  ];
  const selling: Field[] = [
    { name: "timeframe", label: "Timeframe to sell", options: ["Now", "3 months", "6 months", "A year or more", "Not sure"] },
    { name: "price_in_mind", label: "Price they have in mind" },
    { name: "reason_selling", label: "Reason for selling" },
    { name: "moving_to", label: "Where they're moving to" },
    { name: "mortgage_status", label: "Mortgage", options: ["Has a mortgage", "Free and clear", "Not sure"] },
  ];
  const buying: Field[] = [
    { name: "preapproved", label: "Pre-approved?", options: ["Yes", "No", "In progress"] },
    { name: "lender", label: "Lender" },
    { name: "price_range", label: "Price range" },
  ];
  const personal: Field[] = [
    { name: "birthday", label: "Birthday", type: "date" },
    { name: "home_anniversary", label: "Home anniversary", type: "date" },
    { name: "kids", label: "Kids' names" },
  ];

  return (
    <form action={updatePerson.bind(null, p.id)} className="card space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">📇 Details</h2>
        <SubmitButton>Save details</SubmitButton>
      </div>
      <Section title="Contact" fields={contact} p={p} />
      {p.list === "probate" && <Section title="Probate" fields={probate} p={p} />}
      {p.list === "expired" && <Section title="Expired listing" fields={expired} p={p} />}
      {p.list === "client" && <Section title="Their deal" fields={deal} p={p} />}
      <Section title="Selling details" fields={selling} p={p} />
      {p.list === "client" && <Section title="Buying details" fields={buying} p={p} />}
      {p.list === "client" && <Section title="Personal" fields={personal} p={p} />}
      <div>
        <label className="label" htmlFor="d-tags">Tags (separate with commas)</label>
        <input id="d-tags" name="tags" defaultValue={(p.tags ?? []).join(", ")} className="input" />
        <p className="mt-2 text-sm text-stone-500">Ideas: {DAY_ONE_TAGS.join(" · ")}</p>
      </div>
      <SubmitButton className="btn-gold w-full">Save details</SubmitButton>
    </form>
  );
}
