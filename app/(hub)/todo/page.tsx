import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addTask } from "@/app/actions";
import { TaskRow } from "@/components/TaskRow";
import { OkBanner } from "@/components/OkBanner";
import { SubmitButton } from "@/components/SubmitButton";
import { TASK_TYPES } from "@/lib/constants";
import { addDaysISO, todayISO } from "@/lib/dates";
import type { Task } from "@/lib/types";

export default async function TodoPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("tasks").select("*, people(name, list, phone)").is("done_at", null).order("due_date").order("created_at");
  if (type) q = q.eq("type", type);
  const { data: tasks } = await q.returns<Task[]>();

  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);
  const groups = [
    { title: "Overdue", items: (tasks ?? []).filter((t) => t.due_date < today), tone: "text-red-600" },
    { title: "Today", items: (tasks ?? []).filter((t) => t.due_date === today), tone: "text-charcoal" },
    { title: "This week", items: (tasks ?? []).filter((t) => t.due_date > today && t.due_date <= weekEnd), tone: "text-charcoal" },
    { title: "Later", items: (tasks ?? []).filter((t) => t.due_date > weekEnd), tone: "text-stone-500" },
  ];

  return (
    <div>
      <h1 className="h1 mb-5">To-Do</h1>
      <div className="mb-5"><OkBanner /></div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/todo" className={`chip ${!type ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white"}`}>All</Link>
        {TASK_TYPES.map((t) => (
          <Link key={t} href={`/todo?type=${t}`} className={`chip ${type === t ? "border-gold bg-gold text-charcoal" : "border-stone-300 bg-white"}`}>
            {t}
          </Link>
        ))}
      </div>

      <form action={addTask} className="card mb-6 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="title">Add a to-do</label>
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

      {!tasks?.length && <div className="card text-center text-stone-500">Nothing to do{type ? ` for ${type}` : ""}. Nice! 🎉</div>}

      <div className="space-y-6">
        {groups.filter((g) => g.items.length).map((g) => (
          <section key={g.title}>
            <h2 className={`mb-2 text-lg font-bold ${g.tone}`}>{g.title} <span className="text-stone-400">({g.items.length})</span></h2>
            <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              {g.items.map((t) => <TaskRow key={t.id} t={t} />)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
