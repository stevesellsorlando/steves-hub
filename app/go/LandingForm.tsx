"use client";

import { useState } from "react";

type Kind = "Buyer" | "Seller";

const COPY: Record<Kind, { title: string; sub: string; button: string }> = {
  Buyer: { title: "Let's find your next home", sub: "Tell us how to reach you, and Steve will call you to talk about what you're looking for.", button: "Help me find a home" },
  Seller: { title: "Thinking about selling?", sub: "Tell us how to reach you, and Steve will call you with a free home value and a plan to sell.", button: "Get my home's value" },
};

export function LandingForm({ src }: { src: string }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, src, name: f.get("name"), phone: f.get("phone"), email: f.get("email"), consent: f.get("consent") === "on", website: f.get("website") }),
      });
      const j = await res.json();
      if (j.ok) setDone(true);
      else setError(j.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-gold/40 bg-white/5 p-8 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-3 text-2xl font-bold text-gold">Thank you!</h2>
        <p className="mt-2 text-stone-200">We got your information. Steve will reach out to you soon.</p>
        <a href="https://royaltyreb.com" className="mt-6 inline-block rounded-xl border border-gold px-5 py-3 font-semibold text-gold hover:bg-gold hover:text-black">
          Visit royaltyreb.com
        </a>
      </div>
    );
  }

  if (!kind) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {(["Buyer", "Seller"] as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className="rounded-3xl border-2 border-gold bg-gold px-3 py-6 text-center text-black shadow-lg sm:px-6 sm:py-8 transition hover:bg-gold-light active:scale-[0.98]"
          >
            <span className="block text-4xl">{k === "Buyer" ? "🏡" : "💰"}</span>
            <span className="mt-2 block text-xl font-extrabold sm:text-2xl">{k === "Buyer" ? "I'm Buying" : "I'm Selling"}</span>
            <span className="mt-1 block text-sm font-medium">{k === "Buyer" ? "Find your next home" : "Get your home's value"}</span>
          </button>
        ))}
      </div>
    );
  }

  const c = COPY[kind];
  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-gold/40 bg-white/5 p-6 text-left">
      <button type="button" onClick={() => setKind(null)} className="text-sm text-stone-400 hover:text-gold">← Back</button>
      <div>
        <h2 className="text-2xl font-bold text-gold">{c.title}</h2>
        <p className="mt-1 text-stone-300">{c.sub}</p>
      </div>
      <input name="name" required autoComplete="name" placeholder="Your name" className="w-full rounded-xl border border-stone-600 bg-black px-4 py-3.5 text-lg text-white placeholder:text-stone-500 focus:border-gold focus:outline-none" />
      <input name="phone" type="tel" autoComplete="tel" placeholder="Phone number" className="w-full rounded-xl border border-stone-600 bg-black px-4 py-3.5 text-lg text-white placeholder:text-stone-500 focus:border-gold focus:outline-none" />
      <input name="email" type="email" autoComplete="email" placeholder="Email" className="w-full rounded-xl border border-stone-600 bg-black px-4 py-3.5 text-lg text-white placeholder:text-stone-500 focus:border-gold focus:outline-none" />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-3 text-sm text-stone-400">
        <input name="consent" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#c9a24a]" />
        <span>
          I agree that Royalty Real Estate Boutique may contact me by phone call, text message or email about buying or selling real estate. Message and data rates may apply. I can opt out anytime.{" "}
          <a href="/privacy" className="underline hover:text-gold">Privacy</a>
        </span>
      </label>
      {error && <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-gold px-6 py-4 text-lg font-extrabold text-black hover:bg-gold-light disabled:opacity-60">
        {busy ? "Sending…" : c.button}
      </button>
    </form>
  );
}
