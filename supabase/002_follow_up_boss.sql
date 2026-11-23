-- Steve's Hub: Follow Up Boss connection
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".

-- Remember each person's Follow Up Boss ID, so nobody gets doubled
alter table public.people add column if not exists fub_id bigint;
alter table public.people add column if not exists fub_stage text;
alter table public.people add column if not exists fub_updated_at timestamptz;
create unique index if not exists people_user_fub_idx on public.people (user_id, fub_id) where fub_id is not null;

-- Your hub's own settings (one row per login)
create table if not exists public.app_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  fub_sync_enabled boolean not null default false,
  fub_last_synced_at timestamptz,
  fub_last_result text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
drop policy if exists "own settings" on public.app_settings;
create policy "own settings" on public.app_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
