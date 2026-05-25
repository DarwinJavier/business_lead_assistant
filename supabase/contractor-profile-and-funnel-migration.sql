alter table public.clients
add column if not exists business_preferences text;

update public.clients
set business_preferences = case slug
  when 'northline-design-build' then 'Prefers kitchen, bathroom, main-floor, and whole-home renovations. Smaller repair work is acceptable when it may lead to a larger relationship.'
  when 'clearspace-basements' then 'Specializes in basement finishing, basement renovations, and lower-level living spaces. Kitchen or outdoor projects are usually lower priority.'
  when 'prime-coat-painting' then 'Prefers painting, finishing, drywall repair, trim, and refresh projects. Large structural renovation work is usually not ideal.'
  when 'cedar-stone-outdoor' then 'Prefers decks, patios, outdoor living spaces, fencing, and landscape-adjacent carpentry. Interior renovation work is not the main focus.'
  else business_preferences
end
where business_preferences is null or trim(business_preferences) = '';

alter type public.lead_status add value if not exists 'appointment_scheduled';
alter type public.lead_status add value if not exists 'proposal_sent';
alter type public.lead_status add value if not exists 'won';
alter type public.lead_status add value if not exists 'lost';
