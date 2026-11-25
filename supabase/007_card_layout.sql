-- Steve's Hub: Follow Up Boss-style cards (labeled phones/emails/addresses + relationships)
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".

-- All phones, emails and addresses with their labels (mobile, home, work...)
alter table public.people add column if not exists phones jsonb;
alter table public.people add column if not exists emails jsonb;
alter table public.people add column if not exists addresses jsonb;

-- People connected to a card: spouse, realtor, attorney, executor...
create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  label text,
  name text not null,
  phone text,
  email text,
  address text,
  fub_rel_id bigint,
  created_at timestamptz not null default now()
);
create unique index if not exists relationships_user_fub_idx on public.relationships (user_id, fub_rel_id);
create index if not exists relationships_person_idx on public.relationships (person_id);

alter table public.relationships enable row level security;
drop policy if exists "own relationships" on public.relationships;
create policy "own relationships" on public.relationships for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.relationships to authenticated;
grant all on public.relationships to service_role;

-- Notes you delete in the hub are hidden (not erased), so a later Follow Up Boss import can't bring them back
alter table public.notes add column if not exists hidden boolean not null default false;
