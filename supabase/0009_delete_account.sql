-- Lets a signed-in person (guest or full account) delete their own account.
-- Their joins, messages, stories, reads, reports and blocks go with them.
-- Runs they host that haven't happened yet are removed; past runs stay for
-- the people who ran them, shown as hosted by "Deleted user".
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;

  delete from public.runs where host_id = uid and starts_at > now();
  update public.runs set host_id = null, host_name = 'Deleted user'
    where host_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
