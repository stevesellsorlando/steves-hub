import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addNote,
  addRelationship,
  completeTask,
  deletePerson,
  deleteRelationship,
  deleteTask,
  editContact,
  editNote,
  editRelationship,
  editTask,
  hideNote,
  logCallNote,
  renamePerson,
  setTags,
  logTouch,
  moveToClients,
  setFollowUp,
  setStage,
} from "@/app/actions";
import { draftEmail } from "@/app/emailActions";
import { FollowUpPicker } from "@/components/FollowUpPicker";
import { MicButton } from "@/components/MicButton";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Tabs } from "@/components/Tabs";
import { Edit, EditButton, EditPanel } from "@/components/Edit";
import { contactList, type ContactKind } from "@/lib/contact";
import { DetailsForm } from "./DetailsForm";
import { gmailForPerson } from "@/lib/personEmails";
import { LISTS, stagesFor } from "@/lib/constants";
import { dueLabel, prettyDateTime, todayISO } from "@/lib/dates";
import type { Labeled, Note, Person, Relationship, Task } from "@/lib/types";
import { DAY_ONE_TAGS } from "@/lib/constants";
import { prettyPhone } from "@/lib/format";

export const maxDuration = 30;

const REL_LABELS = ["Spouse", "Husband", "Wife", "Partner", "Son", "Daughter", "Family", "Executor", "Heir", "Attorney", "Realtor", "Lender", "Other"];

const FILTERS = [
  { key: "all", label: "All", icon: "☰" },
  { key: "email", label: "Emails", icon: "✉️" },
  { key: "text", label: "Texts", icon: "💬" },
  { key: "call", label: "Calls", icon: "📞" },
  { key: "note", label: "Notes", icon: "📌" },
  { key: "history", label: "History", icon: "🔄" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

type Item = { key: string; type: Exclude<FilterKey, "all">; date: string; title?: string; body: string; who?: string; link?: string; noteId?: string };

function ago(iso: string | null) {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months} month${months > 1 ? "s" : ""} ago` : `${Math.floor(months / 12)} year${months >= 24 ? "s" : ""} ago`;
}

const initials = (name: string) =>
  name
    .replace(/&|and/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const LABELS: Record<ContactKind, string[]> = {
  phones: ["mobile", "home", "work", "other"],
  emails: ["personal", "work", "other"],
  addresses: ["home", "work", "mailing", "property", "other"],
};
const ICON: Record<ContactKind, string> = { phones: "📞", emails: "✉️", addresses: "🏠" };

function ContactRow({ personId, kind, item, index }: { personId: string; kind: ContactKind; item: Labeled; index: number }) {
  const href = kind === "phones" ? `tel:${item.value}` : kind === "emails" ? `mailto:${item.value}` : null;
  const shown = kind === "phones" ? prettyPhone(item.value) : item.value;
  return (
    <li>
      <div className="flex items-center gap-2">
        <span className="w-5 shrink-0 text-center">{ICON[kind]}</span>
        <span className={`min-w-0 flex-1 ${kind === "addresses" ? "" : "truncate whitespace-nowrap"}`} title={item.value}>
          {href ? <a className="text-blue-700 hover:underline" href={href}>{shown}</a> : shown}
          {item.label && <span className="text-stone-400"> ({item.label.toLowerCase()})</span>}
        </span>
        <EditButton id={`edit-${kind}-${index}`} label={`Edit this ${kind.slice(0, -1)}`} />
      </div>
      <EditPanel id={`edit-${kind}-${index}`}>
        <ContactForm personId={personId} kind={kind} index={index} item={item} />
      </EditPanel>
    </li>
  );
}

function ContactForm({ personId, kind, index, item }: { personId: string; kind: ContactKind; index: number; item?: Labeled }) {
  const label = item?.label?.toLowerCase() ?? "";
  return (
    <form action={editContact.bind(null, personId, kind, index)} className="space-y-2">
      <input
        name="value"
        defaultValue={item?.value ?? ""}
        required
        type={kind === "emails" ? "email" : kind === "phones" ? "tel" : "text"}
        placeholder={kind === "phones" ? "Phone" : kind === "emails" ? "Email" : "Address"}
        className="input py-2"
      />
      <select name="label" defaultValue={label} className="input py-2">
        <option value="">(no label)</option>
        {label && !LABELS[kind].includes(label) && <option>{label}</option>}
        {LABELS[kind].map((l) => <option key={l}>{l}</option>)}
      </select>
      <div className="flex gap-2">
        <SubmitButton className="btn-gold px-3 py-1.5 text-sm">Save</SubmitButton>
        {index >= 0 && (
          <button name="op" value="delete" className="btn-light px-3 py-1.5 text-sm text-red-700">Delete</button>
        )}
      </div>
    </form>
  );
}

export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; t?: string }> }) {
  const { id } = await params;
  const { saved, t } = await searchParams;
  const filter: FilterKey = (FILTERS.find((f) => f.key === t)?.key ?? "all") as FilterKey;
  const supabase = await createClient();

  const { data: person } = await supabase.from("people").select("*").eq("id", id).single<Person>();
  if (!person) notFound();

  const phones = contactList(person, "phones");
  const emails = contactList(person, "emails");
  const addresses = contactList(person, "addresses");

  const [{ data: notes }, { data: tasks }, { data: rels }, { data: sentByHub }, gmail] = await Promise.all([
    supabase.from("notes").select("*").eq("person_id", id).not("hidden", "is", true).order("created_at", { ascending: false }).returns<Note[]>(),
    supabase.from("tasks").select("*").eq("person_id", id).is("done_at", null).order("due_date").returns<Task[]>(),
    supabase.from("relationships").select("*").eq("person_id", id).order("created_at").returns<Relationship[]>(),
    supabase.from("outbox").select("gmail_message_id").eq("person_id", id).eq("status", "sent"),
    gmailForPerson(supabase, emails.map((e) => e.value)),
  ]);

  // Remember this visit for "Recently opened" in the search bar
  await supabase.from("people").update({ last_viewed_at: new Date().toISOString() }).eq("id", id);

  // One timeline: hub notes, calls, texts, history, plus Gmail emails (without doubling emails sent from the hub)
  const hubGmailIds = new Set((sentByHub ?? []).map((s) => s.gmail_message_id).filter(Boolean));
  const items: Item[] = [
    ...(notes ?? []).map((n) => ({
      key: n.id,
      noteId: n.id,
      type: (n.kind === "note" && n.body.startsWith("History:") ? "history" : n.kind) as Item["type"],
      date: n.created_at,
      body: n.body,
    })),
    ...gmail.emails
      .filter((m) => !hubGmailIds.has(m.id))
      .map((m) => ({
        key: `gm-${m.id}`,
        type: "email" as const,
        date: m.date,
        title: m.subject,
        body: m.snippet,
        who: m.from.replace(/<.*>/, "").trim(),
        link: `https://mail.google.com/mail/${gmail.account ? `?authuser=${encodeURIComponent(gmail.account)}` : ""}#all/${m.threadId}`,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, f.key === "all" ? items.length : items.filter((i) => i.type === f.key).length]));
  const shown = filter === "all" ? items : items.filter((i) => i.type === filter);

  const meta = LISTS[person.list];
  const today = todayISO();

  return (
    <div className="space-y-4">
      <Link href={meta.path} className="text-sm text-stone-500 hover:text-charcoal">← Back to {meta.label}</Link>
      {saved && <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-green-800">✓ Saved.</div>}

      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)_280px]">
        {/* ---------- LEFT: who they are ---------- */}
        <div className="space-y-5">
          <section className="card space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/80 text-lg font-bold text-charcoal">{initials(person.name)}</span>
              <div className="min-w-0">
                <div className="flex items-start gap-1">
                  <h1 className="break-words text-xl font-bold leading-tight">{person.name}</h1>
                  <Edit label="Edit name">
                    <form action={renamePerson.bind(null, person.id)} className="space-y-2">
                      <input name="name" defaultValue={person.name} required className="input py-2" />
                      <SubmitButton className="btn-gold px-3 py-1.5 text-sm">Save</SubmitButton>
                    </form>
                  </Edit>
                </div>
                <p className="text-sm text-stone-500">Last contact {ago(person.last_contacted_at)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-gold/40 bg-amber-50 text-gold-dark">{meta.one}</span>
              <form key={person.stage ?? ""} action={setStage.bind(null, person.id)} className="flex items-center gap-2">
                <select name="stage" defaultValue={person.stage ?? ""} aria-label="Stage" className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm">
                  {person.stage && !stagesFor(person.list).includes(person.stage) && <option>{person.stage}</option>}
                  {stagesFor(person.list).map((s) => <option key={s}>{s}</option>)}
                </select>
                <SubmitButton className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm font-semibold hover:border-gold" pendingText="…">Set</SubmitButton>
              </form>
            </div>

            <ul className="space-y-2 text-[15px]">
              {phones.map((p, i) => <ContactRow key={`p${i}${p.value}`} personId={person.id} kind="phones" item={p} index={i} />)}
              {emails.map((e, i) => <ContactRow key={`e${i}${e.value}`} personId={person.id} kind="emails" item={e} index={i} />)}
              {addresses.map((a, i) => <ContactRow key={`a${i}${a.value}`} personId={person.id} kind="addresses" item={a} index={i} />)}
              {person.list !== "client" && person.property_address && !addresses.some((a) => a.value === person.property_address) && (
                <li className="flex gap-3"><span className="w-5 shrink-0 text-center">🏚️</span><span>{person.property_address} <span className="text-stone-400">(property)</span></span></li>
              )}
              {!phones.length && !emails.length && !addresses.length && <li className="text-stone-400">No contact info yet.</li>}
            </ul>
            <div className="flex flex-wrap gap-2 text-sm">
              {(["phones", "emails", "addresses"] as ContactKind[]).map((k) => (
                <details key={k} className="w-full">
                  <summary className="cursor-pointer text-gold-dark hover:underline">+ Add {k === "phones" ? "phone" : k === "emails" ? "email" : "address"}</summary>
                  <div className="mt-2 rounded-xl border border-gold/40 bg-amber-50/60 p-3">
                    <ContactForm personId={person.id} kind={k} index={-1} />
                  </div>
                </details>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {person.tags?.length ? (
                person.tags.map((tag) => <span key={tag} className="chip border-stone-200 bg-stone-50 py-1 text-xs">🏷️ {tag}</span>)
              ) : (
                <span className="text-sm text-stone-400">No tags</span>
              )}
              <Edit label="Edit tags">
                <form action={setTags.bind(null, person.id)} className="space-y-2">
                  <input name="tags" defaultValue={(person.tags ?? []).join(", ")} className="input py-2" placeholder="Tags, separated by commas" />
                  <p className="text-xs text-stone-500">Ideas: {DAY_ONE_TAGS.join(" · ")}</p>
                  <SubmitButton className="btn-gold px-3 py-1.5 text-sm">Save tags</SubmitButton>
                </form>
              </Edit>
            </div>

            <div className="flex flex-wrap gap-2">
              <form action={logTouch.bind(null, person.id, "call")}><SubmitButton className="btn-dark px-3 py-2 text-sm">📞 Called</SubmitButton></form>
              <form action={logTouch.bind(null, person.id, "text")}><SubmitButton className="btn-dark px-3 py-2 text-sm">💬 Texted</SubmitButton></form>
              {person.list !== "client" && (
                <form action={moveToClients.bind(null, person.id)}>
                  <ConfirmButton className="btn-gold px-3 py-2 text-sm" message={`Move ${person.name} to your Clients list? Their notes and follow-ups come along.`}>⭐ Became a client</ConfirmButton>
                </form>
              )}
            </div>
          </section>

          <section className="card space-y-3">
            <h2 className="text-lg font-bold">👥 Relationships {rels?.length ? <span className="text-stone-400">({rels.length})</span> : null}</h2>
            {rels?.length ? (
              <ul className="space-y-4">
                {rels.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">{initials(r.name)}</span>
                      <p className="min-w-0 flex-1 truncate whitespace-nowrap" title={r.name}>
                        <strong>{r.name}</strong>
                        {r.label && <span className="text-stone-500"> ({r.label})</span>}
                      </p>
                      <EditButton id={`edit-rel-${r.id}`} label={`Edit ${r.name}`} />
                      <form action={deleteRelationship.bind(null, r.id, person.id)}>
                        <ConfirmButton className="rounded-md px-1.5 py-0.5 text-sm text-stone-400 hover:bg-red-50 hover:text-red-600" message={`Remove ${r.name} from this card?`}>🗑️</ConfirmButton>
                      </form>
                    </div>
                    <div className="ml-10 space-y-0.5 text-[15px]">
                      {r.phone && <p className="truncate whitespace-nowrap"><a className="text-blue-700 hover:underline" href={`tel:${r.phone}`}>📞 {prettyPhone(r.phone)}</a></p>}
                      {r.email && <p className="truncate whitespace-nowrap" title={r.email}><a className="text-blue-700 hover:underline" href={`mailto:${r.email}`}>✉️ {r.email}</a></p>}
                      {r.address && <p className="text-stone-600">🏠 {r.address}</p>}
                    </div>
                    <EditPanel id={`edit-rel-${r.id}`}>
                      <form action={editRelationship.bind(null, r.id, person.id)} className="space-y-2">
                        <input name="name" defaultValue={r.name} required className="input py-2" />
                        <select name="label" defaultValue={r.label ?? ""} className="input py-2">
                          <option value="">(no label)</option>
                          {r.label && !REL_LABELS.includes(r.label) && <option>{r.label}</option>}
                          {REL_LABELS.map((l) => <option key={l}>{l}</option>)}
                        </select>
                        <input name="phone" defaultValue={r.phone ?? ""} placeholder="Phone" className="input py-2" />
                        <input name="email" defaultValue={r.email ?? ""} placeholder="Email" className="input py-2" />
                        <input name="address" defaultValue={r.address ?? ""} placeholder="Address" className="input py-2" />
                        <SubmitButton className="btn-gold px-3 py-1.5 text-sm">Save</SubmitButton>
                      </form>
                    </EditPanel>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-500">No one connected yet.</p>
            )}
            <details className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <summary className="cursor-pointer font-semibold">+ Add a relationship</summary>
              <form action={addRelationship.bind(null, person.id)} className="mt-3 space-y-2">
                <input name="name" required placeholder="Name" className="input py-2" />
                <select name="label" defaultValue="Spouse" className="input py-2">
                  {REL_LABELS.map((l) => <option key={l}>{l}</option>)}
                </select>
                <input name="phone" type="tel" placeholder="Phone" className="input py-2" />
                <input name="email" type="email" placeholder="Email" className="input py-2" />
                <input name="address" placeholder="Address" className="input py-2" />
                <SubmitButton className="btn-gold w-full py-2">Add</SubmitButton>
              </form>
            </details>
          </section>
        </div>

        {/* ---------- MIDDLE: do something + timeline ---------- */}
        <div className="min-w-0 space-y-5">
          <section className="card pt-2">
            <Tabs labels={["📌 Create note", "✉️ Send email", "📞 Log call"]}>
              <form action={addNote.bind(null, person.id)} className="space-y-3">
                <div className="flex justify-end"><MicButton targetId="note-body" /></div>
                <textarea id="note-body" name="body" rows={4} className="input bg-amber-50/40" placeholder="What did they tell you?" />
                <p className="label">And follow up in</p>
                <FollowUpPicker />
                <SubmitButton>Create note</SubmitButton>
              </form>

              <form action={draftEmail} className="space-y-3">
                <input type="hidden" name="person_id" value={person.id} />
                <input name="to" type="email" defaultValue={emails[0]?.value ?? ""} required placeholder="To" className="input" />
                <input name="subject" placeholder="Subject" className="input" />
                <div className="flex justify-end"><MicButton targetId="em-body" /></div>
                <textarea id="em-body" name="body" rows={6} className="input" placeholder="Message" />
                <SubmitButton>Save for my OK</SubmitButton>
                <p className="text-sm text-stone-500">It won&apos;t send yet. It waits in “Needs your OK” until you approve it.</p>
              </form>

              <form action={logCallNote.bind(null, person.id)} className="space-y-3">
                <select name="outcome" defaultValue="Talked to them" className="input">
                  {["Talked to them", "Left a voicemail", "No answer", "Bad number", "Appointment set"].map((o) => <option key={o}>{o}</option>)}
                </select>
                <div className="flex justify-end"><MicButton targetId="call-body" /></div>
                <textarea id="call-body" name="body" rows={3} className="input" placeholder="What did they say?" />
                <p className="label">Follow up in</p>
                <FollowUpPicker />
                <SubmitButton>Log call</SubmitButton>
              </form>
            </Tabs>
          </section>

          <section className="card p-0">
            <div className="flex flex-wrap gap-1 border-b border-stone-200 px-3 pt-2">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={`/people/${person.id}${f.key === "all" ? "" : `?t=${f.key}`}`}
                  scroll={false}
                  className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold ${filter === f.key ? "border-gold text-charcoal" : "border-transparent text-stone-500 hover:text-charcoal"}`}
                >
                  {f.icon} {f.key === "all" ? "All" : counts[f.key]}
                  <span className="sr-only"> {f.label}</span>
                </Link>
              ))}
            </div>
            <div className="p-5">
              {gmail.note && <p className="mb-3 text-sm text-stone-500">{gmail.note}</p>}
              {shown.length ? (
                <ul className="space-y-4">
                  {shown.map((i) => (
                    <li key={i.key} className="border-l-4 border-gold/60 pl-4">
                      <p className="text-sm text-stone-500">
                        {FILTERS.find((f) => f.key === i.type)?.icon ?? "📌"} {prettyDateTime(i.date)}
                        {i.who ? ` · ${i.who}` : ""}
                      </p>
                      {i.title && (
                        i.link ? (
                          <a href={i.link} target="_blank" rel="noreferrer" className="font-semibold hover:text-gold-dark">{i.title} ↗</a>
                        ) : (
                          <p className="font-semibold">{i.title}</p>
                        )
                      )}
                      <p className="whitespace-pre-wrap text-[15px]">{i.body}</p>
                      {i.noteId ? (
                        <div className="mt-1 flex items-start gap-1">
                          <Edit label="Edit">
                            <form action={editNote.bind(null, i.noteId, person.id)} className="space-y-2">
                              <textarea name="body" defaultValue={i.body} rows={4} className="input" />
                              <SubmitButton className="btn-gold px-3 py-1.5 text-sm">Save</SubmitButton>
                            </form>
                          </Edit>
                          <form action={hideNote.bind(null, i.noteId, person.id)}>
                            <ConfirmButton className="rounded-md px-1.5 py-0.5 text-sm text-stone-400 hover:bg-red-50 hover:text-red-600" message="Delete this from the timeline?">🗑️</ConfirmButton>
                          </form>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-stone-400">From your Gmail · change it in Gmail</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-500">Nothing here yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* ---------- RIGHT: follow-ups ---------- */}
        <div className="space-y-5">
          <section className="card">
            <h2 className="mb-3 text-lg font-bold">✅ Follow-ups {tasks?.length ? <span className="text-stone-400">({tasks.length})</span> : null}</h2>
            {tasks?.length ? (
              <ul className="mb-4 space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 rounded-xl bg-stone-50 px-3 py-2.5">
                    <form action={completeTask.bind(null, t.id)}>
                      <SubmitButton className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-stone-300 text-xs text-transparent hover:border-gold hover:text-gold" pendingText="✓">✓</SubmitButton>
                    </form>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t.title}</p>
                      <p className={`text-sm ${t.due_date < today ? "text-red-600" : "text-stone-500"}`}>{dueLabel(t.due_date)}</p>
                      <Edit label="Edit follow-up">
                        <form action={editTask.bind(null, t.id, person.id)} className="space-y-2">
                          <input name="title" defaultValue={t.title} required className="input py-2" />
                          <input name="due_date" type="date" defaultValue={t.due_date} className="input py-2" />
                          <div className="flex gap-2">
                            <SubmitButton className="btn-gold px-3 py-1.5 text-sm">Save</SubmitButton>
                            <button formAction={deleteTask.bind(null, t.id)} className="btn-light px-3 py-1.5 text-sm text-red-700">Delete</button>
                          </div>
                        </form>
                      </Edit>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-stone-500">No follow-up set.</p>
            )}
            <form action={setFollowUp.bind(null, person.id)} className="space-y-3">
              <p className="label">Follow up in</p>
              <FollowUpPicker defaultChoice="3d" allowNone={false} />
              <SubmitButton className="btn-gold w-full">Set follow-up</SubmitButton>
            </form>
          </section>
        </div>
      </div>

      <details className="group">
        <summary className="card cursor-pointer text-lg font-bold">📇 All details (click to view or edit)</summary>
        <div className="mt-4">
          <DetailsForm key={JSON.stringify(person)} person={person} />
        </div>
      </details>

      <form action={deletePerson.bind(null, person.id, person.list)} className="pb-4 text-right">
        <ConfirmButton className="text-sm text-red-600 underline" message={`Delete ${person.name} and all their notes and follow-ups? This can't be undone.`}>
          Delete this card
        </ConfirmButton>
      </form>
    </div>
  );
}
