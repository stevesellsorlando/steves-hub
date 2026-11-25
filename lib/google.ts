// Talks to Google (Gmail now, Calendar next) for Steve, using his own Google sign-in.
// GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET live only in Vercel's Environment Variables.
import type { SupabaseClient } from "@supabase/supabase-js";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

// Trimmed, so a stray space or line break from copying can't break sign-in
const CLIENT_ID = () => (process.env.GOOGLE_CLIENT_ID ?? "").trim();
const CLIENT_SECRET = () => (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();

export function googleConfigured() {
  return Boolean(CLIENT_ID() && CLIENT_SECRET());
}

// A safe peek at the keys (never the whole secret), to spot copy-and-paste mix-ups
export function googleKeyCheck() {
  const id = CLIENT_ID();
  const secret = CLIENT_SECRET();
  const raw = process.env.GOOGLE_CLIENT_SECRET ?? "";
  return {
    idLooksRight: id.endsWith(".apps.googleusercontent.com"),
    idEnd: id.slice(-30),
    secretStart: secret.slice(0, 7),
    secretEnd: secret.slice(-4),
    secretLength: secret.length,
    hadExtraSpaces: raw.length !== secret.length,
  };
}

export function redirectUri(origin: string) {
  return `${origin}/api/google/callback`;
}

export function authUrl(origin: string, state: string, hintEmail?: string | null) {
  const p = new URLSearchParams({
    client_id: CLIENT_ID(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "select_account consent",
    include_granted_scopes: "true",
    state,
  });
  // When reconnecting, steer Google to the work account already connected
  if (hintEmail) {
    p.set("login_hint", hintEmail);
    const domain = hintEmail.split("@")[1];
    if (domain && !/^(gmail|googlemail)\.com$/i.test(domain)) p.set("hd", domain);
  }
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string; scope?: string; id_token?: string; error?: string; error_description?: string };

export async function exchangeCode(code: string, origin: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID(),
      client_secret: CLIENT_SECRET(),
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  return res.json();
}

export class GoogleNotConnected extends Error {
  constructor() {
    super("Google isn't connected yet. Go to Settings and click “Connect Google.”");
  }
}

// A fresh access token, renewing it with the saved refresh token when needed
export async function accessToken(supabase: SupabaseClient, userId: string): Promise<{ token: string; email: string | null }> {
  const { data: g } = await supabase.from("google_accounts").select("*").eq("user_id", userId).maybeSingle();
  if (!g?.refresh_token) throw new GoogleNotConnected();
  if (g.access_token && g.expires_at && new Date(g.expires_at).getTime() > Date.now() + 60_000) {
    return { token: g.access_token, email: g.email };
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID(),
      client_secret: CLIENT_SECRET(),
      refresh_token: g.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const t: TokenResponse = await res.json();
  if (!t.access_token) {
    throw new Error(`Google asked you to sign in again (${t.error ?? "expired"}). Go to Settings and click “Reconnect Google.”`);
  }
  await supabase
    .from("google_accounts")
    .update({ access_token: t.access_token, expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString() })
    .eq("user_id", userId);
  return { token: t.access_token, email: g.email };
}

async function gmail<T = any>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Gmail error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function gmailRetry<T = any>(token: string, path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await gmail<T>(token, path);
    } catch (e) {
      const busy = e instanceof Error && /Gmail error (429|403).*(concurrent|rate|Rate)/.test(e.message);
      if (!busy || attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
}

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const encodeHeader = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`);

export async function sendEmail(token: string, to: string, subject: string, body: string): Promise<string> {
  const mime = [
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n");
  const sent = await gmail<{ id: string }>(token, "/messages/send", { method: "POST", body: JSON.stringify({ raw: b64url(mime) }) });
  return sent.id;
}

export type EmailSummary = { id: string; threadId: string; subject: string; from: string; to: string; date: string; snippet: string };

// Recent emails to or from these addresses, newest first
export async function emailsWith(token: string, addresses: string[], max = 25): Promise<EmailSummary[]> {
  const clean = addresses.filter(Boolean).map((a) => a.trim());
  if (!clean.length) return [];
  const q = clean.map((a) => `from:${a} OR to:${a} OR cc:${a}`).join(" OR ");
  const list = await gmail<{ messages?: { id: string; threadId: string }[] }>(token, `/messages?maxResults=${max}&q=${encodeURIComponent(q)}`);
  // A few at a time: Gmail refuses too many at once
  const ids = list.messages ?? [];
  const msgs: any[] = [];
  for (let i = 0; i < ids.length; i += 5) {
    const group = await Promise.all(
      ids.slice(i, i + 5).map((m) =>
        gmailRetry(token, `/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`),
      ),
    );
    msgs.push(...group);
  }
  return msgs.map((m) => {
    const h = (name: string) => m.payload?.headers?.find((x: any) => x.name.toLowerCase() === name.toLowerCase())?.value ?? "";
    return {
      id: m.id,
      threadId: m.threadId,
      subject: h("Subject") || "(no subject)",
      from: h("From"),
      to: h("To"),
      date: new Date(Number(m.internalDate)).toISOString(),
      snippet: (m.snippet ?? "").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
    };
  });
}
