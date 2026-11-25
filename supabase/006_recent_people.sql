-- Steve's Hub: remember when you last opened each card (for "recent people" in the search bar)
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".
alter table public.people add column if not exists last_viewed_at timestamptz;
create index if not exists people_user_viewed_idx on public.people (user_id, last_viewed_at desc);
