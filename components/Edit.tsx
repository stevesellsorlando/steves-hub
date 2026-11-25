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
