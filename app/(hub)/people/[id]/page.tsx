import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addNote, completeTask, deletePerson, logTouch, moveToClients, setFollowUp, setStage } from "@/app/actions";
import { FollowUpPicker } from "@/components/FollowUpPicker";
import { MicButton } from "@/components/MicButton";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { DetailsForm } from "./DetailsForm";
import { EmailSection } from "./EmailSection";
import { LISTS, stagesFor } from "@/lib/constants";
import { dueLabel, prettyDateTime, todayISO } from "@/lib/dates";
import type { Note, Person, Task } from "@/lib/types";

export const maxDuration = 30;

const KIND_ICON: Record<string, string> = { note: "📝", call: "📞", text: "💬", email: "✉️" };

export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();

  const { data: person } = await supabase.from("people").select("*").eq("id", id).single<Person>();
  if (!person) notFound();

  const [{ data: notes }, { data: tasks }] = await Promise.all([
    supabase.from("notes").select("*").eq("person_id", id).order("created_at", { ascending: false }).returns<Note[]>(),
    supabase.from("tasks").select("*").eq("person_id", id).is("done_at", null).order("due_date").returns<Task[]>(),
  ]);

  // Remember this visit for "Recently opened" in the search bar
  await supabase.from("people").update({ last_viewed_at: new Date().toISOString() }).eq("id", id);

  const meta = LISTS[person.list];
  const today = todayISO();

  return (
    <div className="space-y-6">
      <Link href={meta.path} className="text-sm text-stone-500 hover:text-charcoal">← Back to {meta.label}</Link>

      {saved && <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-green-800">✓ Saved.</div>}

      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="chip mb-2 border-gold/40 bg-amber-50 text-gold-dark">{meta.one}</span>
            <h1 className="h1">{person.name}</h1>
            {person.list !== "client" && person.property_address && <p className="mt-1 text-stone-600">🏠 {person.property_address}</p>}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-stone-700">
              {person.phone && <a className="hover:text-gold-dark" href={`tel:${person.phone}`}>📞 {person.phone}</a>}
              {person.phone2 && <a className="hover:text-gold-dark" href={`tel:${person.phone2}`}>📞 {person.phone2}</a>}
              {person.email && <a className="hover:text-gold-dark" href={`mailto:${person.email}`}>✉️ {person.email}</a>}
            </div>
            {person.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {person.tags.map((t) => <span key={t} className="chip border-stone-200 bg-stone-50 text-sm">🏷️ {t}</span>)}
              </div>
            )}
          </div>
          <form key={person.stage ?? ""} action={setStage.bind(null, person.id)} className="flex items-end gap-2">
            <div>
              <label className="label" htmlFor="stage-top">Stage</label>
              <select id="stage-top" name="stage" defaultValue={person.stage ?? ""} className="input py-2">
                {person.stage && !stagesFor(person.list).includes(person.stage) && <option>{person.stage}</option>}
                {stagesFor(person.list).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <SubmitButton className="btn-light py-2">Set</SubmitButton>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <form action={logTouch.bind(null, person.id, "call")}><SubmitButton className="btn-dark">📞 Called</SubmitButton></form>
          <form action={logTouch.bind(null, person.id, "text")}><SubmitButton className="btn-dark">💬 Texted</SubmitButton></form>
          {person.list !== "client" && (
            <form action={moveToClients.bind(null, person.id)}>
              <ConfirmButton className="btn-gold" message={`Move ${person.name} to your Clients list? Their notes and follow-ups come along.`}>
                ⭐ Became a client
              </ConfirmButton>
            </form>
          )}
        </div>
        {person.last_contacted_at && <p className="mt-3 text-sm text-stone-500">Last contact: {prettyDateTime(person.last_contacted_at)}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Follow-ups */}
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">✅ Follow-ups</h2>
          {tasks?.length ? (
            <ul className="mb-4 space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-4 py-3">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className={`text-sm ${t.due_date < today ? "text-red-600" : "text-stone-500"}`}>{dueLabel(t.due_date)}</p>
                  </div>
                  <form action={completeTask.bind(null, t.id)}><SubmitButton className="btn-light py-2" pendingText="…">Done</SubmitButton></form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-stone-500">No follow-up set.</p>
          )}
          <form action={setFollowUp.bind(null, person.id)} className="space-y-3">
            <p className="label">Follow up in</p>
            <FollowUpPicker defaultChoice="3d" allowNone={false} />
            <SubmitButton className="btn-gold">Set follow-up</SubmitButton>
          </form>
        </div>

        {/* Add a note */}
        <div className="card">
          <form action={addNote.bind(null, person.id)} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">📝 Add a note</h2>
              <MicButton targetId="note-body" />
            </div>
            <textarea id="note-body" name="body" rows={4} className="input" placeholder="What did they tell you?" />
            <p className="label">And follow up in</p>
            <FollowUpPicker />
            <SubmitButton>Save note</SubmitButton>
          </form>
        </div>
      </div>

      <EmailSection person={person} />

      {/* Timeline */}
      <div className="card">
        <h2 className="mb-3 text-lg font-bold">🕑 Timeline</h2>
        {notes?.length ? (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="border-l-4 border-gold/60 pl-4">
                <p className="text-sm text-stone-500">{KIND_ICON[n.kind] ?? "📝"} {prettyDateTime(n.created_at)}</p>
                <p className="whitespace-pre-wrap">{n.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-stone-500">Nothing yet. Notes, calls and texts will show up here, newest on top.</p>
        )}
      </div>

      <DetailsForm key={JSON.stringify(person)} person={person} />

      <form action={deletePerson.bind(null, person.id, person.list)} className="pb-4 text-right">
        <ConfirmButton className="text-sm text-red-600 underline" message={`Delete ${person.name} and all their notes and follow-ups? This can't be undone.`}>
          Delete this card
        </ConfirmButton>
      </form>
    </div>
  );
}
