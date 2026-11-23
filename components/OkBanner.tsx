import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Shows only when something is waiting for Steve's approval
export async function OkBanner() {
  const supabase = await createClient();
  const { count } = await supabase.from("outbox").select("id", { count: "exact", head: true }).eq("status", "draft");
  if (!count) return null;
  return (
    <Link href="/ok" className="flex items-center justify-between rounded-2xl border-2 border-gold bg-amber-50 px-5 py-4 font-semibold hover:bg-amber-100">
      <span>✋ {count} {count === 1 ? "email needs" : "emails need"} your OK</span>
      <span className="text-gold-dark">Review →</span>
    </Link>
  );
}
