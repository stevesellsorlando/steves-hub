import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { authUrl, googleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

// "Connect Google" button: sends Steve to Google's sign-in screen
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (!googleConfigured()) return NextResponse.redirect(new URL("/settings?msg=Google+keys+are+missing+in+Vercel", request.url));

  const { data: g } = await supabase.from("google_accounts").select("email").maybeSingle();
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authUrl(request.nextUrl.origin, state, g?.email));
  res.cookies.set("g_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
