"use client";

import { useState } from "react";

// Simple tabs: "Create note · Send email · Log call"
export function Tabs({ labels, children }: { labels: string[]; children: React.ReactNode[] }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap border-b border-stone-200">
        {labels.map((l, n) => (
          <button
            key={l}
            type="button"
            onClick={() => setI(n)}
            className={`-mb-px border-b-2 px-4 py-3 text-[15px] font-semibold ${n === i ? "border-gold text-charcoal" : "border-transparent text-stone-500 hover:text-charcoal"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="pt-4">{children[i]}</div>
    </div>
  );
}
