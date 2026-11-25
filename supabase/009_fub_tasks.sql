-- Steve's Hub: bring in Follow Up Boss tasks
-- Run this ONCE in Supabase > SQL Editor, in the project named "steves-hub".
alter table public.tasks add column if not exists fub_task_id bigint;
alter table public.tasks add column if not exists assigned_to text;
alter table public.tasks add column if not exists due_time text;
create unique index if not exists tasks_user_fub_task_idx on public.tasks (user_id, fub_task_id);
