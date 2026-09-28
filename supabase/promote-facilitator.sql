update public.profiles
set role = 'facilitator'
where id = (
  select id
  from auth.users
  where email = 's.tshakaza@ufh.ac.za'
);

update public.profiles
set role = 'facilitator'
where requested_role = 'facilitator';
