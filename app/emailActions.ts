"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { accessToken, sendEmail } from "@/lib/google";

async function who() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};

// Writing an email never sends it: it goes to "Needs your OK" first.
export async function draftEmail(fd: FormData) {
  const { supabase } = await who();
  const personId = str(fd, "person_id") || null;
  const to = str(fd, "to");
  if (!to) redirect(personId ? `/people/${personId}?msg=${encodeURIComponent("Please add an email address.")}` : "/ok");
  await supabase.from("outbox").insert({ person_id: personId, to_email: to, subject: str(fd, "subject"), body: str(fd, "body") });
  revalidatePath("/", "layout");
  redirect("/ok?msg=" + encodeURIComponent("Saved. It's waiting for your OK below."));
}

export async function testEmailToMe() {
  const { supabase, user } = await who();
  const { data: g } = await supabase.from("google_accounts").select("email").eq("user_id", user.id).maybeSingle();
  if (!g?.email) redirect("/settings?msg=" + encodeURIComponent("Connect Google first."));
  await supabase.from("outbox").insert({
    to_email: g.email,
    subject: "Test from Steve's Hub",
    body: "Hi Steve,\n\nThis is a test email from your hub. If you're reading this, email is working!\n\nSteve's Hub",
  });
  revalidatePath("/", "layout");
  redirect("/ok?msg=" + encodeURIComponent("A test email to yourself is waiting for your OK below."));
}

export async function approveAndSend(id: string, fd: FormData) {
  const { supabase, user } = await who();
  // Save any last edits first
  await supabase.from("outbox").update({ to_email: str(fd, "to"), subject: str(fd, "subject"), body: str(fd, "body") }).eq("id", id);
  const { data: e } = await supabase.from("outbox").select("*").eq("id", id).single();
  if (!e || e.status === "sent") redirect("/ok");
  let msg: string;
  try {
    const { token } = await accessToken(supabase, user.id);
    const gmailId = await sendEmail(token, e.to_email, e.subject, e.body);
    await supabase.from("outbox").update({ status: "sent", sent_at: new Date().toISOString(), gmail_message_id: gmailId, error: null }).eq("id", id);
    if (e.person_id) {
      await supabase.from("notes").insert({ person_id: e.person_id, kind: "email", body: `Email sent: ${e.subject}\n\n${e.body}` });
      await supabase.from("people").update({ last_contacted_at: new Date().toISOString() }).eq("id", e.person_id);
    }
    msg = `✓ Sent to ${e.to_email}. It's in your Gmail Sent folder.`;
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    await supabase.from("outbox").update({ error: why }).eq("id", id);
    msg = `Not sent: ${why}`;
  }
  revalidatePath("/", "layout");
  redirect("/ok?msg=" + encodeURIComponent(msg));
}

export async function discardDraft(id: string) {
  const { supabase } = await who();
  await supabase.from("outbox").delete().eq("id", id).neq("status", "sent");
  revalidatePath("/", "layout");
  redirect("/ok");
}
