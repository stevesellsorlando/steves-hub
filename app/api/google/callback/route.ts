import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/google";

export const dynamic = "force-dynamic";

function back(request: NextRequest, msg: string) {
  const res = NextResponse.redirect(new URL(`/settings?msg=${encodeURIComponent(msg)}`, request.url));
  res.cookies.delete("g_state");
  return res;
}

// Google sends Steve back here after he clicks "Allow"
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const sp = request.nextUrl.searchParams;
  if (sp.get("error")) return back(request, `Google wasn't connected (${sp.get("error")}). You can try again anytime.`);
  if (!sp.get("state") || sp.get("state") !== request.cookies.get("g_state")?.value) {
    return back(request, "That sign-in link expired. Please click “Connect Google” again.");
  }

  const t = await exchangeCode(sp.get("code") ?? "", request.nextUrl.origin);
  if (!t.access_token) return back(request, `Google sign-in didn't finish (${t.error_description ?? t.error ?? "unknown"}). Please try again.`);

  let email: string | null = null;
  if (t.id_token) {
    try {
      email = JSON.parse(Buffer.from(t.id_token.split(".")[1], "base64url").toString("utf8")).email ?? null;
    } catch {}
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    email,
    access_token: t.access_token,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    scopes: t.scope ?? null,
    connected_at: new Date().toISOString(),
  };
  if (t.refresh_token) row.refresh_token = t.refresh_token;
  const { error } = await supabase.from("google_accounts").upsert(row);
  if (error) return back(request, `Couldn't save the Google connection: ${error.message}`);
  return back(request, `✓ Google connected${email ? ` as ${email}` : ""}. Emails you approve will send from this address.`);
}
