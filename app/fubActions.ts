"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncFromFub } from "@/lib/fubSync";

// Used by both "Import them" (first time) and "Sync now"
export async function syncNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  let msg: string;
  try {
    const r = await syncFromFub(supabase, user.id);
    msg = `Done! ${r.total} people checked: ${r.created} new, ${r.updated} updated.`;
  } catch (e) {
    msg = `Something went wrong: ${e instanceof Error ? e.message : String(e)}`;
  }
  revalidatePath("/", "layout");
  redirect(`/settings?msg=${encodeURIComponent(msg)}`);
}
