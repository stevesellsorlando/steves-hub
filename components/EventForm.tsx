import { createEvent } from "@/app/calendarActions";
import { SubmitButton } from "./SubmitButton";
import { todayISO } from "@/lib/dates";

// Add an event to Google Calendar (from the Calendar page or a person's card)
export function EventForm({ personId, title = "", location = "" }: { personId?: string; title?: string; location?: string }) {
  return (
    <form action={createEvent} className="space-y-3">
      {personId && <input type="hidden" name="person_id" value={personId} />}
      <input name="title" defaultValue={title} required placeholder="What is it? (e.g. Listing appointment with the Garcias)" className="input" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Date</label>
          <input name="date" type="date" defaultValue={todayISO()} required className="input" />
        </div>
        <div>
          <label className="label">Time</label>
          <input name="time" type="time" className="input" />
        </div>
        <div>
          <label className="label">How long</label>
          <select name="minutes" defaultValue="60" className="input">
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1½ hours</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
          </select>
        </div>
      </div>
      <input name="location" defaultValue={location} placeholder="Where? (optional)" className="input" />
      <textarea name="notes" rows={2} placeholder="Notes (optional)" className="input" />
      <SubmitButton>📅 Add to my calendar</SubmitButton>
      <p className="text-sm text-stone-500">Leave the time empty for an all-day event. You&apos;ll get a reminder 30 minutes before.</p>
    </form>
  );
}
