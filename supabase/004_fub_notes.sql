-- Steve's Hub: bring in notes and call logs from Follow Up Boss
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".

-- Remember which Follow Up Boss note each hub note came from, so nothing gets doubled
alter table public.notes add column if not exists fub_note_id text;
create unique index if not exists notes_user_fub_note_idx on public.notes (user_id, fub_note_id);

-- When each person's notes were last brought over (empty = still waiting)
alter table public.people add column if not exists fub_notes_synced_at timestamptz;
alter table public.people add column if not exists fub_last_activity timestamptz;
