"use client";

import { prettyPhone } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Hit = { id: string; name: string; list: "client" | "probate" | "expired"; phone: string | null; property_address: string | null };
const LABEL = { client: "Client", probate: "Probate", expired: "Expired" } as const;

// Search everyone from any page. Click into it to see the last 6 people you opened.
export function SearchBar({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`, { signal: ctrl.signal });
        const j = await res.json();
        setHits(j.people ?? []);
        setActive(0);
      } catch {}
    }, q ? 200 : 0);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function go(h: Hit) {
    setOpen(false);
    setQ("");
    router.push(`/people/${h.id}`);
  }

  return (
    <div ref={box} className="relative w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, hits.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Escape") setOpen(false);
          else if (e.key === "Enter") {
            e.preventDefault();
            if (hits[active]) go(hits[active]);
            else if (q.trim()) router.push(`/clients?q=${encodeURIComponent(q.trim())}`);
          }
        }}
        placeholder="🔍 Search everyone: name, phone, email or address"
        className={`w-full rounded-xl border px-4 py-2.5 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 ${
          dark ? "border-charcoal-lighter bg-charcoal-light text-white placeholder:text-stone-400" : "border-stone-300 bg-white"
        }`}
      />
      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white text-charcoal shadow-lg">
          <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
            {q.trim() ? "Matches" : "Recently opened"}
          </p>
          {hits.length ? (
            <ul className="py-1">
              {hits.map((h, i) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${i === active ? "bg-amber-50" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{h.name}</span>
                      <span className="block truncate text-sm text-stone-500">{[prettyPhone(h.phone), h.property_address].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="chip shrink-0 border-gold/40 bg-amber-50 text-xs text-gold-dark">{LABEL[h.list]}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 pb-3 pt-1 text-sm text-stone-500">
              {q.trim() ? "No one matches that yet." : "People you open will show up here."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
