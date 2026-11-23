-- Steve's Hub: let the signed-in hub (and the daily catch-up) use its own tables.
-- Newer Supabase projects don't open new tables to the app automatically.
-- Row-level security still keeps every row private to its owner.
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.people, public.notes, public.tasks, public.app_settings to authenticated;
grant all on public.people, public.notes, public.tasks, public.app_settings to service_role;
