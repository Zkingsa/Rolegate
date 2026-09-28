alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists middle_name text not null default '',
  add column if not exists surname text not null default '',
  add column if not exists institution_domain text not null default '',
  add column if not exists requested_role text not null default 'student';

alter table public.profiles
  drop constraint if exists profiles_requested_role_check;

alter table public.profiles
  add constraint profiles_requested_role_check
  check (requested_role in ('student', 'facilitator'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    first_name,
    middle_name,
    surname,
    institution_domain,
    requested_role,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'middle_name', ''),
    coalesce(new.raw_user_meta_data ->> 'surname', ''),
    coalesce(new.raw_user_meta_data ->> 'institution_domain', ''),
    case
      when new.raw_user_meta_data ->> 'requested_role' = 'facilitator' then 'facilitator'
      else 'student'
    end,
    case
      when new.raw_user_meta_data ->> 'requested_role' = 'facilitator' then 'facilitator'
      else 'student'
    end
  );
  return new;
end;
$$;
