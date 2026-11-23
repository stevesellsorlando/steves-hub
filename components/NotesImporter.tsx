"use client";

import { useState } from "react";
import { importNotesNow } from "@/app/fubActions";

// Keeps asking for the next batch until every person's notes are in. Safe to close and resume later.
export function NotesImporter({ waiting, total }: { waiting: number; total: number }) {
  const [remaining, setRemaining] = useState(waiting);
  const [added, setAdded] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    let left = remaining;
    while (left > 0) {
      const r = await importNotesNow();
      if (r.error) {
        setError(r.error);
        break;
      }
      setAdded((a) => a + r.notesAdded);
      left = r.remaining;
      setRemaining(left);
      if (r.done === 0) break;
    }
    setRunning(false);
  }

  const finished = total - remaining;
  const pct = total ? Math.round((finished / total) * 100) : 100;

  if (remaining === 0) {
    return (
      <p className="rounded-xl bg-green-50 px-4 py-3 text-green-800">
        ✓ Notes are up to date{added ? ` (${added} notes and calls brought in just now)` : ""}.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
        <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-stone-600">
        {finished} of {total} people done · {remaining} waiting{added ? ` · ${added} notes and calls brought in` : ""}
      </p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button onClick={run} disabled={running} className="btn-gold">
        {running ? "Bringing in notes… keep this page open" : finished ? "Keep going" : "📝 Bring in notes"}
      </button>
      {running && <p className="text-sm text-stone-500">You can close this page anytime. It picks up where it left off.</p>}
    </div>
  );
}
