-- ClassPick Supabase database setup
-- Run this entire script in Supabase SQL Editor.

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  roll text not null unique check (char_length(trim(roll)) between 1 and 30),
  created_at timestamptz default now()
);

alter table public.students enable row level security;

-- This starter policy is safe only when public signups are disabled
-- and you create trusted administrator accounts manually.
create policy "Authenticated admins can view students"
on public.students for select
to authenticated
using (true);

create policy "Authenticated admins can add students"
on public.students for insert
to authenticated
with check (true);

create policy "Authenticated admins can remove students"
on public.students for delete
to authenticated
using (true);

-- Enforce the 50-student limit in the database as well as the UI.
create or replace function public.enforce_student_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.students) >= 50 then
    raise exception 'Maximum limit of 50 students reached.';
  end if;
  return new;
end;
$$;

create trigger student_limit_trigger
before insert on public.students
for each row
execute function public.enforce_student_limit();
