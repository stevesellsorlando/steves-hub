import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addTask } from "@/app/actions";
import { TaskRow } from "@/components/TaskRow";
import { SubmitButton } from "@/components/SubmitButton";
import { OkBanner } from "@/components/OkBanner";
import { TASK_TYPES } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overdue", label: "Overdue", icon: "🔴" },
  { key: "today", label: "Today", icon: "📍" },
  { key: "upcoming", label: "Upcoming", icon: "📆" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ type?: string; tab?: string }> }) {
  const { type, tab } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("tasks").select("*, people(name, list, phone)").is("done_at", null).order("due_date").order("created_at");
  if (type) q = q.eq("type", type);
  const { data: tasks } = await q.returns<Task[]>();

  const today = todayISO();
  const groups: Record<TabKey, Task[]> = {
    overdue: (tasks ?? []).filter((t) => t.due_date < today),
    today: (tasks ?? []).filter((t) => t.due_date === today),
    upcoming: (tasks ?? []).filter((t) => t.due_date > today),
  };
  // Open on Overdue when something slipped, otherwise Today
  const active: TabKey = (TABS.find((t) => t.key === tab)?.key ?? (groups.overdue.length ? "overdue" : "today")) as TabKey;
  const shown = groups[active];
  const href = (k: string, ty?: string) => `/tasks?tab=${k}${ty ? `&type=${ty}` : ""}`;

  return (
    <div>
      <h1 className="h1 mb-5">✅ Tasks</h1>
      <div className="mb-5"><OkBanner /></div>

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={href(t.key, type)}
            className={`rounded-2xl border-2 px-3 py-4 text-center transition ${
              active === t.key ? "border-gold bg-gold text-charcoal shadow" : "border-stone-200 bg-white hover:border-gold"
            }`}
          >
            <span className="block text-2xl font-extrabold">
              {t.key === "overdue" && groups.overdue.length > 0 && active !== "overdue" ? <span className="text-red-600">{groups.overdue.length}</span> : groups[t.key].length}
            </span>
            <span className="text-sm font-semibold sm:text-base">{t.icon} {t.label}</span>
          </Link>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href={href(active)} className={`chip ${!type ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white"}`}>All types</Link>
        {TASK_TYPES.map((t) => (
          <Link key={t} href={href(active, t)} className={`chip ${type === t ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white"}`}>
            {t}
          </Link>
        ))}
      </div>

      {shown.length ? (
        <ul className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {shown.map((t) => <TaskRow key={t.id} t={t} />)}
        </ul>
      ) : (
        <div className="card mb-6 text-center text-stone-500">
          {active === "overdue" ? "Nothing overdue. Nice! 🎉" : active === "today" ? "Nothing due today. 🎉" : "Nothing coming up."}
        </div>
      )}

      <form action={addTask} className="card flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="title">Add a task</label>
          <input id="title" name="title" required className="input" placeholder="Order new yard signs" />
        </div>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={type ?? "Other"} className="input">
            {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="due_date">Due</label>
          <input id="due_date" name="due_date" type="date" defaultValue={today} className="input" />
        </div>
        <SubmitButton>Add</SubmitButton>
      </form>
    </div>
  );
}
