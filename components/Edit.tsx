"use client";

import { useEffect, useState } from "react";

// A small ✏️ button that opens an edit form right where it is (no extra page)
export function Edit({ children, label = "Edit", className = "" }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <details className={`group/edit ${className}`}>
      <summary title={label} aria-label={label} className="inline-flex cursor-pointer list-none items-center rounded-md px-1.5 py-0.5 text-sm text-stone-400 hover:bg-amber-50 hover:text-gold-dark [&::-webkit-details-marker]:hidden">
        ✏️
      </summary>
      <div className="mt-2 rounded-xl border border-gold/40 bg-amber-50/60 p-3">{children}</div>
    </details>
  );
}

// ✏️ button and its form kept apart, so the button can sit at the end of a one-line row
export function EditButton({ id, label }: { id: string; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => window.dispatchEvent(new CustomEvent("toggle-edit", { detail: id }))}
      className="shrink-0 rounded-md px-1.5 py-0.5 text-sm text-stone-400 hover:bg-amber-50 hover:text-gold-dark"
    >
      ✏️
    </button>
  );
}

export function EditPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: Event) => {
      if ((e as CustomEvent).detail === id) setOpen((o) => !o);
    };
    window.addEventListener("toggle-edit", h);
    return () => window.removeEventListener("toggle-edit", h);
  }, [id]);
  if (!open) return null;
  return <div className="mt-2 rounded-xl border border-gold/40 bg-amber-50/60 p-3">{children}</div>;
}
