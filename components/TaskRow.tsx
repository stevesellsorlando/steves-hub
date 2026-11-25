import { prettyPhone } from "@/lib/format";
import Link from "next/link";
import { completeTask, deleteTask, editTask } from "@/app/actions";
import { Edit } from "./Edit";
import { SubmitButton } from "./SubmitButton";
import { dueLabel, todayISO } from "@/lib/dates";
import type { Task } from "@/lib/types";

export function TaskRow({ t }: { t: Task }) {
  const overdue = t.due_date < todayISO();
  return (
    <li className="flex items-center gap-3 border-b border-stone-100 px-5 py-3 last:border-0">
      <form action={completeTask.bind(null, t.id)}>
        <SubmitButton className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-stone-300 text-transparent hover:border-gold hover:text-gold" pendingText="✓">
          ✓
        </SubmitButton>
      </form>
      <div className="min-w-0 flex-1">
        {t.person_id && t.people ? (
          <Link href={`/people/${t.person_id}`} className="font-medium hover:text-gold-dark">{t.title}</Link>
        ) : (
          <p className="font-medium">{t.title}</p>
        )}
        <p className="text-sm text-stone-500">
          <span className={overdue ? "text-red-600" : ""}>{dueLabel(t.due_date)}{t.due_time ? ` · ${t.due_time}` : ""}</span>
          {t.assigned_to && <> · 👤 {t.assigned_to}</>}
          {t.people?.name && !t.title.includes(t.people.name) && <> · {t.people.name}</>}
          {t.people?.phone && <> · <a href={`tel:${t.people.phone}`} className="hover:text-gold-dark">📞 {prettyPhone(t.people.phone)}</a></>}
        </p>
      </div>
      <span className="chip border-stone-200 bg-stone-50 text-xs">{t.type}</span>
      <Edit label="Edit task" className="relative">
        <form action={editTask.bind(null, t.id, t.person_id)} className="w-64 space-y-2">
          <input name="title" defaultValue={t.title} required className="input py-2" />
          <input name="due_date" type="date" defaultValue={t.due_date} className="input py-2" />
          <div className="flex gap-2">
            <SubmitButton className="btn-gold px-3 py-1.5 text-sm">Save</SubmitButton>
            <button formAction={deleteTask.bind(null, t.id)} className="btn-light px-3 py-1.5 text-sm text-red-700">Delete</button>
          </div>
        </form>
      </Edit>
    </li>
  );
}
