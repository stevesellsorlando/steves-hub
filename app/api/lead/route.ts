import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sourceFromParam } from "@/lib/constants";
import { fubConfigured, sendFubLead } from "@/lib/fub";
import { accessToken, sendEmail } from "@/lib/google";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const clean = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// The public landing page sends new leads here. No login: anyone can submit, so we check the basics.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 400 });
  }
  // Bots fill in the hidden "website" box; people never see it
  if (clean(body.website)) return NextResponse.json({ ok: true });

  const kind = body.kind === "Seller" ? "Seller" : "Buyer";
  const name = clean(body.name, 80);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 120).toLowerCase();
  const source = sourceFromParam(clean(body.src, 40));
  if (!name || (!phone && !email)) return NextResponse.json({ ok: false, error: "Please add your name and a phone number or email." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  if (!body.consent) return NextResponse.json({ ok: false, error: "Please check the box so we can contact you." }, { status: 400 });

  const admin = createAdminClient();
  const { data: owner } = await admin.from("app_settings").select("user_id").limit(1).maybeSingle();
  let userId = owner?.user_id as string | undefined;
  if (!userId) {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    userId = data.users[0]?.id;
  }
  if (!userId) return NextResponse.json({ ok: false, error: "Something went wrong. Please call us instead." }, { status: 500 });

  // Already in the hub? Add to their card instead of making a double.
  const digits = phone.replace(/\D/g, "").slice(-10);
  const ors = [email ? `email.ilike.${email}` : "", email ? `email2.ilike.${email}` : "", digits.length === 10 ? `phone.ilike.%${digits.slice(-4)}%` : ""].filter(Boolean).join(",");
  const { data: maybe } = ors
    ? await admin.from("people").select("id, name, phone, phone2, email, email2").eq("user_id", userId).or(ors).limit(20)
    : { data: [] as { id: string; name: string; phone: string | null; phone2: string | null; email: string | null; email2: string | null }[] };
  const existing = (maybe ?? []).find(
    (p) =>
      (email && [p.email, p.email2].some((e) => e?.toLowerCase() === email)) ||
      (digits.length === 10 && [p.phone, p.phone2].some((x) => (x ?? "").replace(/\D/g, "").slice(-10) === digits)),
  );

  let personId = existing?.id as string | undefined;
  if (!personId) {
    const { data: made, error } = await admin
      .from("people")
      .insert({
        user_id: userId,
        list: "client",
        name,
        stage: "Lead",
        buyer_seller: kind,
        lead_source: source,
        phone: phone || null,
        email: email || null,
        tags: ["Landing page", kind],
      })
      .select("id")
      .single();
    if (error || !made) return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
    personId = made.id;
  }

  await admin.from("notes").insert({
    user_id: userId,
    person_id: personId,
    kind: "note",
    body: `🎯 New ${kind.toLowerCase()} lead from the landing page (${source}).\n${[name, phone, email].filter(Boolean).join(" · ")}`,
  });
  await admin.from("tasks").insert({ user_id: userId, person_id: personId, title: `Call new ${kind.toLowerCase()} lead: ${name}`, type: "Client", due_date: todayISO() });

  // Also into Follow Up Boss, so its lead rules and action plans run (the daily sync links the two, no doubles)
  if (fubConfigured()) {
    const [firstName, ...rest] = name.split(/\s+/);
    try {
      await sendFubLead({ firstName, lastName: rest.join(" "), email, phone, kind, source, message: `${kind} lead from Steve's Hub landing page (${source}).` });
    } catch {}
  }

  // Email alert to Steve
  try {
    const { token, email: me } = await accessToken(admin, userId);
    if (me) {
      const link = `${request.nextUrl.origin}/people/${personId}`;
      await sendEmail(
        token,
        me,
        `🎯 New ${kind} lead: ${name}`,
        `New ${kind.toLowerCase()} lead from your landing page (${source}).\n\nName: ${name}\nPhone: ${phone || "-"}\nEmail: ${email || "-"}\n\nOpen their card: ${link}\n\nA "call today" follow-up is on your Tasks list.`,
      );
    }
  } catch {}

  return NextResponse.json({ ok: true });
}
