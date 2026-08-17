begin;

-- Canonical development/maintenance project model.
-- RLS is intentionally disabled. Only the server-side service_role can access it.

create table public.development_projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null,
  project_name text not null,
  normalized_name text not null,
  region_code text not null,
  district_name text,
  location_text text,
  project_type text not null,
  program_tags text[] not null default '{}'::text[],
  parent_project_id uuid references public.development_projects(id) on delete set null,
  legal_status text,
  business_stage text,
  business_stage_order smallint not null default 0,
  raw_stage text,
  area_m2 numeric,
  planned_households integer,
  operator_name text,
  geometry jsonb,
  center_latitude double precision,
  center_longitude double precision,
  notice_no text,
  notice_date date,
  official_url text,
  match_confidence text not null default 'source',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint development_projects_project_key_unique unique (project_key),
  constraint development_projects_name_check
    check (project_name = btrim(project_name) and char_length(project_name) between 1 and 300),
  constraint development_projects_region_code_check
    check (region_code in ('11', '28', '41')),
  constraint development_projects_stage_order_check
    check (business_stage_order between 0 and 100),
  constraint development_projects_area_check
    check (area_m2 is null or area_m2 >= 0),
  constraint development_projects_households_check
    check (planned_households is null or planned_households >= 0),
  constraint development_projects_center_check
    check (
      (center_latitude is null and center_longitude is null)
      or (
        center_latitude between 32 and 40
        and center_longitude between 123 and 133
      )
    ),
  constraint development_projects_match_confidence_check
    check (match_confidence in ('source', 'exact', 'normalized', 'spatial', 'manual'))
);

create index development_projects_region_type_stage_idx
  on public.development_projects (region_code, project_type, business_stage_order desc);

create index development_projects_program_tags_idx
  on public.development_projects using gin (program_tags);

create index development_projects_parent_idx
  on public.development_projects (parent_project_id)
  where parent_project_id is not null;

create index development_projects_normalized_name_idx
  on public.development_projects (region_code, normalized_name);

create index development_projects_notice_idx
  on public.development_projects (notice_no)
  where notice_no is not null;

create table public.development_project_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.development_projects(id) on delete cascade,
  source_provider text not null,
  source_dataset text not null,
  source_record_id text not null,
  source_base_date date,
  source_updated_at timestamptz,
  official_url text,
  raw_record jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now(),

  constraint development_project_sources_record_unique
    unique (source_dataset, source_record_id)
);

create index development_project_sources_project_idx
  on public.development_project_sources (project_id, source_base_date desc);

create table public.development_project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.development_projects(id) on delete cascade,
  event_type text not null,
  event_name text not null,
  event_date date,
  notice_no text,
  official_url text,
  source_id uuid references public.development_project_sources(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint development_project_events_identity_unique
    unique (project_id, event_type, event_date, notice_no)
);

create index development_project_events_project_date_idx
  on public.development_project_events (project_id, event_date desc nulls last);

create trigger development_projects_set_updated_at
before update on public.development_projects
for each row execute function public.set_updated_at();

alter table public.development_projects disable row level security;
alter table public.development_project_sources disable row level security;
alter table public.development_project_events disable row level security;

revoke all on table public.development_projects from public, anon, authenticated;
revoke all on table public.development_project_sources from public, anon, authenticated;
revoke all on table public.development_project_events from public, anon, authenticated;

grant select, insert, update, delete
  on table public.development_projects,
    public.development_project_sources,
    public.development_project_events
  to service_role;

commit;
