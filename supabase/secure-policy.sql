alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.exam_events enable row level security;

create policy "Profiles are visible to authenticated users"
on public.profiles for select
to authenticated using (true);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Authenticated users can read assignments"
on public.assignments for select
to authenticated using (true);

create policy "Facilitators can create assignments"
on public.assignments for insert
to authenticated
with check (
  (select auth.uid()) = created_by
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'facilitator'
  )
);

create policy "Students can log their own exam events"
on public.exam_events for insert
to authenticated
with check ((select auth.uid()) = student_id);

create policy "Facilitators can review exam events"
on public.exam_events for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'facilitator'
  )
);
