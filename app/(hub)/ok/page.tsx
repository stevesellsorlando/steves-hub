import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approveAndSend, discardDraft } from "@/app/emailActions";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { prettyDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Outbox = { id: string; person_id: string | null; to_email: string; subject: string; body: string; status: string; drafted_by: string; error: string | null; sent_at: string | null; created_at: string; people?: { name: string } | null };

export default async function NeedsYourOk({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const supabase = await createClient();
  const [{ data: drafts }, { data: sent }, { data: g }] = await Promise.all([
    supabase.from("outbox").select("*, people(name)").eq("status", "draft").order("created_at").returns<Outbox[]>(),
    supabase.from("outbox").select("*, people(name)").eq("status", "sent").order("sent_at", { ascending: false }).limit(10).returns<Outbox[]>(),
    supabase.from("google_accounts").select("email").maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">✋ Needs your OK</h1>
        <p className="text-stone-500">Nothing sends until you tap “Approve &amp; send.” Emails go out from {g?.email ?? "your Google email (connect it in Settings)"}.</p>
      </div>
      {msg && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">{msg}</div>}

      {!drafts?.length && <div className="card text-stone-500">Nothing waiting for you. 🎉</div>}

      {drafts?.map((d) => (
        <form key={d.id} action={approveAndSend.bind(null, d.id)} className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-500">
            <span>
              ✉️ Email{d.people?.name && d.person_id ? <> to <Link className="underline" href={`/people/${d.person_id}`}>{d.people.name}</Link></> : null}
              {d.drafted_by === "claude" ? " · drafted by Claude" : ""}
            </span>
            <span>{prettyDateTime(d.created_at)}</span>
          </div>
          <div>
            <label className="label" htmlFor={`to-${d.id}`}>To</label>
            <input id={`to-${d.id}`} name="to" defaultValue={d.to_email} className="input" required />
          </div>
          <div>
            <label className="label" htmlFor={`s-${d.id}`}>Subject</label>
            <input id={`s-${d.id}`} name="subject" defaultValue={d.subject} className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`b-${d.id}`}>Message</label>
            <textarea id={`b-${d.id}`} name="body" defaultValue={d.body} rows={8} className="input" />
          </div>
          {d.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Last try didn&apos;t send: {d.error}</p>}
          <div className="flex flex-wrap gap-3">
            <SubmitButton className="btn-gold" pendingText="Sending…">✅ Approve &amp; send</SubmitButton>
            <button formAction={discardDraft.bind(null, d.id)} className="btn-light">Delete</button>
          </div>
        </form>
      ))}

      {sent?.length ? (
        <section>
          <h2 className="mb-2 text-lg font-bold">Recently sent</h2>
          <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {sent.map((s) => (
              <li key={s.id} className="border-b border-stone-100 px-5 py-3 last:border-0">
                <p className="font-medium">{s.subject || "(no subject)"}</p>
                <p className="text-sm text-stone-500">To {s.people?.name ?? s.to_email} · {s.sent_at ? prettyDateTime(s.sent_at) : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
