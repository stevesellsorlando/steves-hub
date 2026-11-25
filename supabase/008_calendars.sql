-- Steve's Hub: which Google calendars to show (work, family, personal...)
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".
alter table public.google_accounts add column if not exists shown_calendars jsonb;
