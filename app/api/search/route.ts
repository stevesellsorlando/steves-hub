import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Powers the search bar: ?recent=1 gives the last 6 people opened; ?q=... gives quick matches from all lists
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ people: [] }, { status: 401 });

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  let query = supabase.from("people").select("id, name, list, phone, property_address").limit(q ? 8 : 6);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query
      .or(`name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%,property_address.ilike.%${safe}%,address.ilike.%${safe}%`)
      .order("last_viewed_at", { ascending: false, nullsFirst: false })
      .order("name");
  } else {
    query = query.not("last_viewed_at", "is", null).order("last_viewed_at", { ascending: false });
  }
  const { data } = await query;
  return NextResponse.json({ people: data ?? [] });
}
