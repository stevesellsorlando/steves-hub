import { draftEmail } from "@/app/emailActions";
import { SubmitButton } from "@/components/SubmitButton";
import { MicButton } from "@/components/MicButton";
import { createClient } from "@/lib/supabase/server";
import { accessToken, emailsWith, GoogleNotConnected, type EmailSummary } from "@/lib/google";
import { prettyDateTime } from "@/lib/dates";
import type { Person } from "@/lib/types";

// Write an email (it waits for your OK), and see past emails with this person straight from Gmail.
export async function EmailSection({ person }: { person: Person }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let emails: EmailSummary[] = [];
  let note: string | null = null;
  let account: string | null = null;
  const addresses = [person.email, person.email2].filter(Boolean) as string[];
  // Emails sent from the hub always show, even before Gmail's search catches up
  const { data: hubSent } = await supabase
    .from("outbox")
    .select("id, subject, body, sent_at, gmail_message_id, to_email")
    .eq("person_id", person.id)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(25);
  if (user && addresses.length) {
    try {
      const { token, email } = await accessToken(supabase, user.id);
      account = email;
      emails = await emailsWith(token, addresses);
    } catch (e) {
      note = e instanceof GoogleNotConnected ? "Connect Google in Settings to see your emails with them here." : e instanceof Error ? e.message : String(e);
    }
  }

  const seen = new Set(emails.map((m) => m.id));
  for (const h of hubSent ?? []) {
    if (h.gmail_message_id && seen.has(h.gmail_message_id)) continue;
    emails.push({
      id: h.gmail_message_id ?? h.id,
      threadId: h.gmail_message_id ?? "",
      subject: h.subject || "(no subject)",
      from: "You (sent from your hub)",
      to: h.to_email,
      date: h.sent_at ?? new Date().toISOString(),
      snippet: (h.body ?? "").slice(0, 160),
    });
  }
  emails.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-bold">✉️ Email</h2>

      <details className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
        <summary className="cursor-pointer font-semibold">Write an email{person.email ? ` to ${person.email}` : ""}</summary>
        <form action={draftEmail} className="mt-3 space-y-3">
          <input type="hidden" name="person_id" value={person.id} />
          <div>
            <label className="label" htmlFor="em-to">To</label>
            <input id="em-to" name="to" type="email" defaultValue={person.email ?? ""} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="em-subject">Subject</label>
            <input id="em-subject" name="subject" className="input" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="label mb-0" htmlFor="em-body">Message</label>
              <MicButton targetId="em-body" />
            </div>
            <textarea id="em-body" name="body" rows={6} className="input" />
          </div>
          <SubmitButton>Save for my OK</SubmitButton>
          <p className="text-sm text-stone-500">It won&apos;t send yet. It waits in “Needs your OK” until you approve it.</p>
        </form>
      </details>

      <div>
        <p className="label">Your emails with them{account ? ` (from ${account})` : ""}</p>
        {note && <p className="mb-2 text-stone-500">{note}</p>}
        {emails.length ? (
          <ul className="space-y-2">
            {emails.map((m) => (
              <li key={m.id} className="rounded-xl bg-stone-50 px-4 py-3">
                <a
                  href={`https://mail.google.com/mail/${account ? `?authuser=${encodeURIComponent(account)}` : ""}#all/${m.threadId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:text-gold-dark"
                >
                  {m.subject} ↗
                </a>
                <p className="text-sm text-stone-500">{prettyDateTime(m.date)} · {m.from.replace(/<.*>/, "").trim()}</p>
                <p className="text-sm text-stone-600">{m.snippet}</p>
              </li>
            ))}
          </ul>
        ) : !addresses.length ? (
          <p className="text-stone-500">No email address on this card yet.</p>
        ) : note ? null : (
          <p className="text-stone-500">No emails found with {addresses.join(" or ")}.</p>
        )}
      </div>
    </div>
  );
}
