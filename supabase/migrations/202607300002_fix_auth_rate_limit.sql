begin;

-- Fixes PostgreSQL resolving `current_time` as the SQL time-with-time-zone
-- expression instead of the intended PL/pgSQL timestamptz variable.
create or replace function public.consume_auth_rate_limit(
  p_action text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
  v_now timestamptz := now();
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.auth_rate_limits (
    action,
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_action,
    p_key_hash,
    v_now,
    1,
    v_now
  )
  on conflict (action, key_hash) do update
  set
    request_count = case
      when public.auth_rate_limits.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else public.auth_rate_limits.request_count + 1
    end,
    window_started_at = case
      when public.auth_rate_limits.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else public.auth_rate_limits.window_started_at
    end,
    updated_at = v_now
  returning request_count
  into current_count;

  delete from public.auth_rate_limits
  where updated_at < v_now - interval '7 days';

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, text, integer, integer)
from public, anon, authenticated;

grant execute on function public.consume_auth_rate_limit(text, text, integer, integer)
to service_role;

commit;
