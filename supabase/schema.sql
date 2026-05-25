create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  brand_color text not null default '#4d6b58',
  logo_url text,
  notification_email text not null,
  phone text,
  website_url text,
  service_area text not null,
  business_region text,
  business_city text,
  business_province text,
  business_postal_code text,
  service_radius_km integer not null default 75,
  project_types text[] not null default '{}',
  lead_fit_criteria text not null default 'A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.',
  business_preferences text,
  preferred_project_types text[] not null default '{}',
  strong_lead_factors text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.lead_status as enum ('new', 'reviewed', 'contacted', 'qualified', 'appointment_scheduled', 'proposal_sent', 'won', 'lost', 'not_fit');
create type public.ai_status as enum ('pending', 'complete', 'failed');
create type public.fit_score as enum ('strong', 'medium', 'weak');

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  status public.lead_status not null default 'new',
  ai_status public.ai_status not null default 'pending',
  fit_score public.fit_score,
  project_type text not null,
  project_description text not null,
  project_goals text,
  project_location text not null,
  timeline text not null,
  budget_range text not null,
  has_photos text not null check (has_photos in ('yes', 'no', 'not_sure')),
  contact_preference text not null check (contact_preference in ('email', 'phone', 'either')),
  homeowner_name text not null,
  homeowner_email text not null,
  homeowner_phone text not null,
  ai_summary jsonb,
  missing_info text[] not null default '{}',
  recommended_next_step text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_client_created_idx on public.leads(client_id, created_at desc);
create index if not exists leads_fit_score_idx on public.leads(fit_score);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists lead_events_lead_idx on public.lead_events(lead_id, created_at desc);

alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.clients to service_role;
grant select, insert, update, delete on public.leads to service_role;
grant select, insert, update, delete on public.lead_events to service_role;

drop policy if exists "service_role_clients_all" on public.clients;
drop policy if exists "service_role_leads_all" on public.leads;
drop policy if exists "service_role_lead_events_all" on public.lead_events;

create policy "service_role_clients_all"
  on public.clients
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_leads_all"
  on public.leads
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_lead_events_all"
  on public.lead_events
  for all
  to service_role
  using (true)
  with check (true);

insert into public.clients (
  id,
  business_name,
  slug,
  brand_color,
  notification_email,
  phone,
  website_url,
  service_area,
  business_region,
  business_city,
  business_province,
  business_postal_code,
  service_radius_km,
  project_types,
  lead_fit_criteria,
  business_preferences,
  preferred_project_types,
  strong_lead_factors,
  is_active
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'Northline Design Build',
    'northline-design-build',
    '#4d6b58',
    'owner+northline@example.com',
    '416-555-0141',
    'https://example.com/northline',
    'Toronto west end and Etobicoke',
    'greater-toronto-area',
    'Toronto',
    'ON',
    'M6P',
    75,
    array['Kitchen renovation', 'Bathroom renovation', 'Basement renovation', 'Whole-home renovation', 'Addition or extension', 'Main floor renovation', 'Deck or outdoor living space', 'Painting or finishing', 'Flooring or tile work', 'Repairs or smaller updates', 'Other'],
    'A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.',
    'Prefers kitchen, bathroom, main-floor, and whole-home renovations. Smaller repair work is acceptable when it may lead to a larger relationship.',
    array['Kitchen renovation', 'Bathroom renovation', 'Main floor renovation', 'Whole-home renovation'],
    array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Useful timeline context'],
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Clearspace Basements',
    'clearspace-basements',
    '#345f7d',
    'owner+clearspace@example.com',
    '905-555-0172',
    'https://example.com/clearspace',
    'Mississauga, Oakville, Burlington',
    'greater-toronto-area',
    'Mississauga',
    'ON',
    'L5B',
    75,
    array['Kitchen renovation', 'Bathroom renovation', 'Basement renovation', 'Whole-home renovation', 'Addition or extension', 'Main floor renovation', 'Deck or outdoor living space', 'Painting or finishing', 'Flooring or tile work', 'Repairs or smaller updates', 'Other'],
    'A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.',
    'Specializes in basement finishing, basement renovations, and lower-level living spaces. Kitchen or outdoor projects are usually lower priority.',
    array['Basement renovation', 'Repairs or smaller updates'],
    array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Complete contact details'],
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Prime Coat Painting',
    'prime-coat-painting',
    '#8a5a44',
    'owner+primecoat@example.com',
    '647-555-0118',
    'https://example.com/primecoat',
    'Toronto, Scarborough, North York',
    'greater-toronto-area',
    'Toronto',
    'ON',
    'M1P',
    50,
    array['Kitchen renovation', 'Bathroom renovation', 'Basement renovation', 'Whole-home renovation', 'Addition or extension', 'Main floor renovation', 'Deck or outdoor living space', 'Painting or finishing', 'Flooring or tile work', 'Repairs or smaller updates', 'Other'],
    'A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.',
    'Prefers painting, finishing, drywall repair, trim, and refresh projects. Large structural renovation work is usually not ideal.',
    array['Painting or finishing', 'Repairs or smaller updates'],
    array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Photos available'],
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Cedar & Stone Outdoor',
    'cedar-stone-outdoor',
    '#6f7f45',
    'owner+cedarstone@example.com',
    '289-555-0157',
    'https://example.com/cedarstone',
    'Hamilton, Ancaster, Dundas',
    'hamilton-halton-niagara',
    'Hamilton',
    'ON',
    'L8P',
    75,
    array['Kitchen renovation', 'Bathroom renovation', 'Basement renovation', 'Whole-home renovation', 'Addition or extension', 'Main floor renovation', 'Deck or outdoor living space', 'Painting or finishing', 'Flooring or tile work', 'Repairs or smaller updates', 'Other'],
    'A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.',
    'Prefers decks, patios, outdoor living spaces, fencing, and landscape-adjacent carpentry. Interior renovation work is not the main focus.',
    array['Deck or outdoor living space', 'Repairs or smaller updates', 'Other'],
    array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Useful timeline context'],
    true
  )
on conflict (slug) do update set
  business_name = excluded.business_name,
  brand_color = excluded.brand_color,
  notification_email = excluded.notification_email,
  phone = excluded.phone,
  website_url = excluded.website_url,
  service_area = excluded.service_area,
  business_region = excluded.business_region,
  business_city = excluded.business_city,
  business_province = excluded.business_province,
  business_postal_code = excluded.business_postal_code,
  service_radius_km = excluded.service_radius_km,
  project_types = excluded.project_types,
  lead_fit_criteria = excluded.lead_fit_criteria,
  business_preferences = excluded.business_preferences,
  preferred_project_types = excluded.preferred_project_types,
  strong_lead_factors = excluded.strong_lead_factors,
  is_active = excluded.is_active,
  updated_at = now();
