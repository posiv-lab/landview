begin;

-- Landview custom authentication.
-- Supabase Auth and auth.users are intentionally not used.
-- RLS is intentionally disabled; access is restricted with grants and a
-- server-only Supabase secret key.

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  nickname text not null,
  role text not null default 'member',
  status text not null default 'pending',
  email_verified_at timestamptz,
  terms_agreed_at timestamptz not null,
  privacy_agreed_at timestamptz not null,
  password_changed_at timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint users_email_length_check
    check (char_length(email) between 3 and 320),
  constraint users_email_normalized_check
    check (email = lower(btrim(email))),
  constraint users_password_hash_check
    check (char_length(password_hash) >= 50),
  constraint users_nickname_check
    check (
      nickname = btrim(nickname)
      and char_length(nickname) between 2 and 30
    ),
  constraint users_role_check
    check (role in ('member', 'moderator', 'admin')),
  constraint users_status_check
    check (status in ('pending', 'active', 'suspended', 'deleted')),
  constraint users_deleted_at_check
    check (
      (status = 'deleted' and deleted_at is not null)
      or (status <> 'deleted' and deleted_at is null)
    )
);

create unique index users_email_unique_idx
  on public.users (email);

create index users_status_created_at_idx
  on public.users (status, created_at desc);

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent_hash text,
  ip_hash text,
  created_at timestamptz not null default now(),

  constraint user_sessions_token_hash_check
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint user_sessions_expiry_check
    check (expires_at > created_at),
  constraint user_sessions_revoked_at_check
    check (revoked_at is null or revoked_at >= created_at)
);

create unique index user_sessions_token_hash_unique_idx
  on public.user_sessions (token_hash);

create index user_sessions_active_user_idx
  on public.user_sessions (user_id, expires_at desc)
  where revoked_at is null;

create index user_sessions_expiry_idx
  on public.user_sessions (expires_at);

create table public.user_action_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  purpose text not null,
  token_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),

  constraint user_action_tokens_purpose_check
    check (purpose in ('verify_email', 'reset_password', 'change_email')),
  constraint user_action_tokens_token_hash_check
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint user_action_tokens_expiry_check
    check (expires_at > created_at),
  constraint user_action_tokens_used_at_check
    check (used_at is null or used_at >= created_at)
);

create unique index user_action_tokens_token_hash_unique_idx
  on public.user_action_tokens (token_hash);

create index user_action_tokens_active_user_purpose_idx
  on public.user_action_tokens (user_id, purpose, expires_at desc)
  where used_at is null;

create index user_action_tokens_expiry_idx
  on public.user_action_tokens (expires_at);

create table public.auth_rate_limits (
  action text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),

  primary key (action, key_hash),
  constraint auth_rate_limits_action_check
    check (
      action in ('signup', 'login', 'forgot', 'verify', 'reset', 'review')
      and char_length(key_hash) = 64
    ),
  constraint auth_rate_limits_request_count_check
    check (request_count >= 1)
);

create index auth_rate_limits_updated_at_idx
  on public.auth_rate_limits (updated_at);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  target_type text not null default 'site',
  target_key text not null default 'landview',
  rating smallint not null,
  title text,
  content text not null,
  status text not null default 'published',
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint reviews_target_type_check
    check (target_type in ('site', 'parcel')),
  constraint reviews_target_key_check
    check (
      target_key = btrim(target_key)
      and char_length(target_key) between 1 and 120
    ),
  constraint reviews_rating_check
    check (rating between 1 and 5),
  constraint reviews_title_check
    check (
      title is null
      or (
        title = btrim(title)
        and char_length(title) between 1 and 100
      )
    ),
  constraint reviews_content_check
    check (
      content = btrim(content)
      and char_length(content) between 20 and 2000
    ),
  constraint reviews_status_check
    check (status in ('published', 'hidden', 'deleted')),
  constraint reviews_edited_at_check
    check (edited_at is null or edited_at >= created_at),
  constraint reviews_deleted_at_check
    check (
      (status = 'deleted' and deleted_at is not null)
      or (status <> 'deleted' and deleted_at is null)
    )
);

create unique index reviews_one_active_per_user_target_idx
  on public.reviews (user_id, target_type, target_key)
  where status <> 'deleted';

create index reviews_public_feed_idx
  on public.reviews (target_type, target_key, created_at desc)
  where status = 'published';

create index reviews_user_created_at_idx
  on public.reviews (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- Safe server-side projection for the public review list and home page.
-- It intentionally excludes email, user ID, account status, and password data.
create view public.review_public_feed
with (security_invoker = true)
as
select
  reviews.id,
  reviews.target_type,
  reviews.target_key,
  reviews.rating,
  reviews.title,
  reviews.content,
  reviews.edited_at,
  reviews.created_at,
  users.nickname
from public.reviews
join public.users on users.id = reviews.user_id
where reviews.status = 'published'
  and users.status = 'active';

create view public.review_public_summary
with (security_invoker = true)
as
select
  reviews.target_type,
  reviews.target_key,
  count(*)::bigint as review_count,
  round(avg(reviews.rating)::numeric, 2) as average_rating
from public.reviews
join public.users on users.id = reviews.user_id
where reviews.status = 'published'
  and users.status = 'active'
group by reviews.target_type, reviews.target_key;

comment on table public.users is
  'Landview custom users. Supabase Auth is not used.';
comment on table public.user_sessions is
  'Opaque Landview sessions. Only SHA-256 token hashes are stored.';
comment on table public.user_action_tokens is
  'Single-use email verification and password reset token hashes.';
comment on table public.auth_rate_limits is
  'Shared rate-limit counters for server authentication and review routes.';
comment on table public.reviews is
  'Member reviews. Public reads use review_public_feed.';
comment on view public.review_public_feed is
  'Safe review fields for public pages, including the main home page.';
comment on view public.review_public_summary is
  'Published review count and average rating by target.';

-- RLS is excluded by design. Do not add policies without revising the
-- application authorization architecture.
alter table public.users disable row level security;
alter table public.user_sessions disable row level security;
alter table public.user_action_tokens disable row level security;
alter table public.auth_rate_limits disable row level security;
alter table public.reviews disable row level security;

-- No browser-facing Supabase role may access these relations directly.
revoke all on schema public from anon, authenticated;
grant usage on schema public to service_role;

revoke all on table public.users from public, anon, authenticated;
revoke all on table public.user_sessions from public, anon, authenticated;
revoke all on table public.user_action_tokens from public, anon, authenticated;
revoke all on table public.auth_rate_limits from public, anon, authenticated;
revoke all on table public.reviews from public, anon, authenticated;
revoke all on table public.review_public_feed from public, anon, authenticated;
revoke all on table public.review_public_summary from public, anon, authenticated;

grant select, insert, update, delete
on table
  public.users,
  public.user_sessions,
  public.user_action_tokens,
  public.auth_rate_limits,
  public.reviews
to service_role;

grant select
on table public.review_public_feed, public.review_public_summary
to service_role;

revoke all on function public.set_updated_at()
from public, anon, authenticated;

revoke all on function public.consume_auth_rate_limit(text, text, integer, integer)
from public, anon, authenticated;

grant execute on function public.set_updated_at()
to service_role;

grant execute on function public.consume_auth_rate_limit(text, text, integer, integer)
to service_role;

-- Apply deny-by-default privileges to objects created by future migrations.
alter default privileges for role postgres in schema public
  revoke all on tables
  from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences
  from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on functions
  from public, anon, authenticated;

commit;
