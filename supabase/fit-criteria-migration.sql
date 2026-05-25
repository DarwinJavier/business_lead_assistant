alter table public.clients
add column if not exists lead_fit_criteria text not null default 'A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.';

update public.clients
set lead_fit_criteria = 'A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.'
where lead_fit_criteria is null or trim(lead_fit_criteria) = '';
