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

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
