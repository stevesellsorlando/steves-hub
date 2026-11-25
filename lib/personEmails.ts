import type { SupabaseClient } from "@supabase/supabase-js";
import { accessToken, emailsWith, GoogleNotConnected, type EmailSummary } from "./google";

// Gmail emails with a person, for their timeline. Never throws: returns a friendly note instead.
export async function gmailForPerson(supabase: SupabaseClient, addresses: string[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !addresses.length) return { emails: [] as EmailSummary[], note: null as string | null, account: null as string | null };
  try {
    const { token, email } = await accessToken(supabase, user.id);
    return { emails: await emailsWith(token, addresses, 40), note: null, account: email };
  } catch (e) {
    const note = e instanceof GoogleNotConnected ? "Connect Google in Settings to see your emails with them here." : e instanceof Error ? e.message : String(e);
    return { emails: [] as EmailSummary[], note, account: null };
  }
}
