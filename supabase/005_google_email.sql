-- Steve's Hub: Google email (and later calendar) connection, plus the "Needs your OK" list
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".

-- Your Google connection (one row per login). Kept private by row-level security.
create table if not exists public.google_accounts (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  email text,
  refresh_token text,
  access_token text,
  expires_at timestamptz,
  scopes text,
  connected_at timestamptz not null default now()
);

-- Emails waiting for your OK, and ones already sent
create table if not exists public.outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  to_email text not null,
  subject text not null default '',
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent', 'failed')),
  drafted_by text not null default 'steve',
  error text,
  gmail_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists outbox_user_status_idx on public.outbox (user_id, status, created_at desc);

alter table public.google_accounts enable row level security;
alter table public.outbox enable row level security;

drop policy if exists "own google" on public.google_accounts;
create policy "own google" on public.google_accounts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own outbox" on public.outbox;
create policy "own outbox" on public.outbox for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.google_accounts, public.outbox to authenticated;
grant all on public.google_accounts, public.outbox to service_role;
