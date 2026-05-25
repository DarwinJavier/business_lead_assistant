alter table public.clients
add column if not exists business_region text,
add column if not exists business_city text,
add column if not exists business_province text,
add column if not exists business_postal_code text,
add column if not exists service_radius_km integer not null default 75,
add column if not exists preferred_project_types text[] not null default '{}',
add column if not exists strong_lead_factors text[] not null default '{}';

update public.clients
set
  business_region = coalesce(business_region, case slug
    when 'northline-design-build' then 'greater-toronto-area'
    when 'clearspace-basements' then 'greater-toronto-area'
    when 'prime-coat-painting' then 'greater-toronto-area'
    when 'cedar-stone-outdoor' then 'hamilton-halton-niagara'
    else business_region
  end),
  business_city = coalesce(business_city, case slug
    when 'northline-design-build' then 'Toronto'
    when 'clearspace-basements' then 'Mississauga'
    when 'prime-coat-painting' then 'Toronto'
    when 'cedar-stone-outdoor' then 'Hamilton'
    else business_city
  end),
  business_province = coalesce(business_province, 'ON'),
  business_postal_code = coalesce(business_postal_code, case slug
    when 'northline-design-build' then 'M6P'
    when 'clearspace-basements' then 'L5B'
    when 'prime-coat-painting' then 'M1P'
    when 'cedar-stone-outdoor' then 'L8P'
    else business_postal_code
  end),
  service_radius_km = coalesce(service_radius_km, case slug
    when 'prime-coat-painting' then 50
    else 75
  end),
  preferred_project_types = case
    when preferred_project_types <> '{}'::text[] then preferred_project_types
    when slug = 'northline-design-build' then array['Kitchen renovation', 'Bathroom renovation', 'Main floor renovation', 'Whole-home renovation']
    when slug = 'clearspace-basements' then array['Basement renovation', 'Repairs or smaller updates']
    when slug = 'prime-coat-painting' then array['Painting or finishing', 'Repairs or smaller updates']
    when slug = 'cedar-stone-outdoor' then array['Deck or outdoor living space', 'Repairs or smaller updates', 'Other']
    else preferred_project_types
  end,
  strong_lead_factors = case
    when strong_lead_factors <> '{}'::text[] then strong_lead_factors
    when slug = 'northline-design-build' then array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Useful timeline context']
    when slug = 'clearspace-basements' then array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Complete contact details']
    when slug = 'prime-coat-painting' then array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Photos available']
    when slug = 'cedar-stone-outdoor' then array['Clear project description', 'Realistic budget', 'Matches preferred work', 'Useful timeline context']
    else strong_lead_factors
  end;
