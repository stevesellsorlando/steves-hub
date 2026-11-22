import Link from "next/link";
import { quickAdd } from "@/app/actions";
import { FollowUpPicker } from "@/components/FollowUpPicker";
import { MicButton } from "@/components/MicButton";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";
import { LISTS, LEAD_SOURCES, defaultSource, defaultStage, isListKey, stagesFor, type ListKey } from "@/lib/constants";

// The fast after-call screen: name, phone, note, next follow-up, all in one place.
export default async function NewPerson({ searchParams }: { searchParams: Promise<{ list?: string; saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const list: ListKey = isListKey(sp.list) ? sp.list : "client";
  const meta = LISTS[list];

  let savedName: string | null = null;
  if (sp.saved) {
    const supabase = await createClient();
    const { data } = await supabase.from("people").select("name").eq("id", sp.saved).single();
    savedName = data?.name ?? null;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(LISTS) as ListKey[]).map((k) => (
          <Link
            key={k}
            href={`/people/new?list=${k}`}
            className={`chip ${k === list ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white"}`}
          >
            New {LISTS[k].one.toLowerCase()}
          </Link>
        ))}
      </div>

      {savedName && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-800">
          ✓ Saved <strong>{savedName}</strong>.{" "}
          <Link href={`/people/${sp.saved}`} className="underline">Open their card</Link>, or add the next one below.
        </div>
      )}

      <h1 className="h1 mb-1">Add a {meta.one.toLowerCase()}</h1>
      <p className="mb-6 text-stone-500">Right after your call: who, their number, what they said, and when to follow up.</p>

      <form action={quickAdd} className="card space-y-5" key={sp.saved ?? "new"}>
        <input type="hidden" name="list" value={list} />

        <div>
          <label className="label" htmlFor="name">
            Name {list !== "client" && <span className="font-normal text-stone-400">(the person you talked to)</span>}
          </label>
          <input id="name" name="name" required autoFocus className="input" placeholder={list === "client" ? "Mike & Lisa Garcia" : "Maria Garcia"} />
          {sp.error === "name" && <p className="mt-1 text-sm text-red-600">Please type a name.</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="input" />
          </div>
        </div>

        {list !== "client" && (
          <div>
            <label className="label" htmlFor="property_address">Property address</label>
            <input id="property_address" name="property_address" className="input" placeholder="123 Elm St, Orlando" />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="stage">Stage</label>
            <select id="stage" name="stage" defaultValue={list === "client" ? defaultStage(list) : "Talked To"} className="input">
              {stagesFor(list).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lead_source">Lead source</label>
            <select id="lead_source" name="lead_source" defaultValue={defaultSource(list)} className="input">
              <option value="">Choose…</option>
              {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="label mb-0" htmlFor="note">What did they tell you?</label>
            <MicButton targetId="note" />
          </div>
          <textarea id="note" name="note" rows={4} className="input" placeholder="Daughter is the executor, house needs a roof, wants to sell in the spring…" />
          <label className="mt-2 flex items-center gap-2 text-stone-600">
            <input type="checkbox" name="called" defaultChecked className="h-5 w-5 accent-[#c9a24a]" />
            I just called them (log it as a call)
          </label>
        </div>

        <div>
          <p className="label">Follow up in</p>
          <FollowUpPicker defaultChoice="3d" />
        </div>

        <SubmitButton className="btn-gold w-full text-lg">Save</SubmitButton>
      </form>
    </div>
  );
}
