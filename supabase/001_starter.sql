-- Steve's Hub: starter filing cabinet (Clients, Probates, Expireds, notes, follow-ups)
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".
-- Every row belongs to the signed-in person, and row-level security keeps it private.

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  list text not null default 'client' check (list in ('client', 'probate', 'expired')),
  name text not null,
  stage text,
  buyer_seller text,          -- Buyer / Seller / Both
  agreement text,             -- Signed / Verbal / Not yet
  lead_source text,
  phone text,
  phone2 text,
  email text,
  email2 text,
  address text,               -- mailing / home address
  property_address text,      -- the house (probate or expired property)
  tags text[] not null default '{}',
  -- selling details
  timeframe text,
  price_in_mind text,
  reason_selling text,
  moving_to text,
  mortgage_status text,
  -- buying details
  preapproved text,
  lender text,
  price_range text,
  -- other details
  closing_date date,
  best_time_to_call text,
  preferred_contact text,
  social_media text,
  birthday date,
  home_anniversary date,
  kids text,
  -- probate details
  deceased_name text,
  relationship text,          -- Executor / Heir / Family member / Attorney
  attorney_name text,
  attorney_phone text,
  case_number text,
  date_filed date,
  -- expired details
  mls_number text,
  list_price text,
  expired_date date,
  previous_agent text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'call', 'text', 'email')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  title text not null,
  type text not null default 'Other',   -- Probate / Expired / Client / Listing / Personal / Other
  due_date date not null default current_date,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists people_user_list_idx on public.people (user_id, list);
create index if not exists notes_person_idx on public.notes (person_id, created_at desc);
create index if not exists tasks_user_open_idx on public.tasks (user_id, done_at, due_date);
create index if not exists tasks_person_idx on public.tasks (person_id);

-- Keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists people_touch on public.people;
create trigger people_touch before update on public.people
  for each row execute function public.touch_updated_at();

-- Row-level security: you only ever see your own rows
alter table public.people enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "own people" on public.people;
create policy "own people" on public.people for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
