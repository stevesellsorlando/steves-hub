import { prettyPhone } from "@/lib/format";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LISTS, stagesFor, type ListKey } from "@/lib/constants";
import { dueLabel, todayISO } from "@/lib/dates";
import type { Person } from "@/lib/types";

const PAGE_SIZE = 100;

export async function PeopleList({ list, q, stage, page = 1 }: { list: ListKey; q?: string; stage?: string; page?: number }) {
  const supabase = await createClient();
  const meta = LISTS[list];

  // Searching looks through all three lists, so nobody hides on the "wrong" list.
  const searchAll = Boolean(q);
  const from = (Math.max(page, 1) - 1) * PAGE_SIZE;
  let query = supabase
    .from("people")
    .select("id, name, stage, phone, property_address, address, tags, list", { count: "exact" })
    .order("name")
    .order("id")
    .range(from, from + PAGE_SIZE - 1);
  if (!searchAll) query = query.eq("list", list);
  if (stage && !searchAll) query = query.eq("stage", stage);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%,property_address.ilike.%${safe}%,address.ilike.%${safe}%`);
  }
  const { data: people, count } = await query.returns<Pick<Person, "id" | "name" | "stage" | "phone" | "property_address" | "address" | "tags" | "list">[]>();
  const total = count ?? people?.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (n: number) => `${meta.path}?page=${n}${stage ? `&stage=${encodeURIComponent(stage)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const ids = (people ?? []).map((p) => p.id);
  const nextDue = new Map<string, string>();
  if (ids.length) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("person_id, due_date")
      .in("person_id", ids)
      .is("done_at", null)
      .order("due_date");
    for (const t of tasks ?? []) if (t.person_id && !nextDue.has(t.person_id)) nextDue.set(t.person_id, t.due_date);
  }
  const today = todayISO();
  const showProperty = list !== "client";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">{meta.label}</h1>
        <Link href={`/people/new?list=${list}`} className="btn-gold">
          + Add {list === "client" ? "a client" : `a ${meta.one.toLowerCase()}`}
        </Link>
      </div>

      <form className="mb-4 flex gap-2">
        {stage && <input type="hidden" name="stage" value={stage} />}
        <input name="q" defaultValue={q} placeholder="Search everyone (all lists) by name, phone or address" className="input" />
        <button className="btn-dark">Search</button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href={meta.path} className={`chip ${!stage ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white"}`}>
          All
        </Link>
        {stagesFor(list).map((s) => (
          <Link
            key={s}
            href={`${meta.path}?stage=${encodeURIComponent(s)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`chip ${stage === s ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {!people?.length ? (
        <div className="card text-center text-stone-500">
          {q || stage ? "No one matches that search." : `No ${meta.label.toLowerCase()} yet. Tap “Add” to put in your first one.`}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {people.map((p) => {
            const due = nextDue.get(p.id);
            return (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="flex flex-col gap-1 border-b border-stone-100 px-5 py-4 last:border-0 hover:bg-amber-50 md:flex-row md:items-center md:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{p.name}</p>
                  <p className="truncate text-sm text-stone-500">
                    {[prettyPhone(p.phone), showProperty ? p.property_address : p.address].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {searchAll && <span className="chip border-gold/40 bg-amber-50 text-gold-dark">{LISTS[p.list].one}</span>}
                  {p.stage && <span className="chip border-stone-200 bg-stone-50">{p.stage}</span>}
                  {due ? (
                    <span className={`chip ${due < today ? "border-red-200 bg-red-50 text-red-700" : due === today ? "border-gold bg-amber-50" : "border-stone-200"}`}>
                      Follow up: {dueLabel(due)}
                    </span>
                  ) : (
                    <span className="chip border-stone-200 text-stone-400">No follow-up</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
        <p>
          {total} {total === 1 ? "person" : "people"}
          {searchAll ? " found across all lists" : ""}
          {pages > 1 ? ` · showing ${from + 1}–${Math.min(from + PAGE_SIZE, total)}` : ""}
        </p>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            {page > 1 && <Link href={pageHref(page - 1)} className="btn-light py-2">← Previous</Link>}
            <span>Page {page} of {pages}</span>
            {page < pages && <Link href={pageHref(page + 1)} className="btn-light py-2">Next →</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
