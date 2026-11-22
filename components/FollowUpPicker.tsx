"use client";

import { useState } from "react";
import { FOLLOW_UPS } from "@/lib/constants";

// One-tap "Follow up in: 1 day · 3 days · 1 week · 2 weeks · 1 month · pick a date"
export function FollowUpPicker({ defaultChoice = "none", allowNone = true }: { defaultChoice?: string; allowNone?: boolean }) {
  const [choice, setChoice] = useState(defaultChoice);
  const options = [
    ...(allowNone ? [{ key: "none", label: "No follow-up" }] : []),
    ...FOLLOW_UPS.map((f) => ({ key: f.key, label: f.label })),
    { key: "date", label: "Pick a date" },
  ];
  return (
    <div>
      <input type="hidden" name="followup" value={choice} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            type="button"
            key={o.key}
            onClick={() => setChoice(o.key)}
            className={`chip ${
              choice === o.key ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white text-stone-700 hover:border-gold"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {choice === "date" && <input type="date" name="followup_date" required className="input mt-3 max-w-xs" />}
    </div>
  );
}
