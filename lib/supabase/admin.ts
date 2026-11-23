import { createClient } from "@supabase/supabase-js";

// Server-only "master key" client, used by the daily Follow Up Boss catch-up (no one is signed in then).
// SUPABASE_SECRET_KEY lives only in Vercel's Environment Variables.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is missing in Vercel");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}
