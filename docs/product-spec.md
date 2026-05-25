# Product Spec

## Goal

Version 1 is a multi-tenant intake layer for local renovation and home-service contractors. It captures structured homeowner inquiries, stores each lead by client, produces an AI summary and fit score, and sends professional email notifications.

## In Scope

- Client-specific intake pages at `/intake/[clientSlug]`
- Multi-step homeowner intake form
- Supabase-backed clients, leads, and lead events
- OpenAI structured JSON summary, fit score, missing info, and next step
- Contractor lead notification email
- Homeowner confirmation email
- Product-owner dashboard at `/dashboard`
- Four seeded pilot clients

## Out Of Scope

- Quote estimation
- Permit, code, legal, or warranty advice
- SMS
- Payment collection
- Client self-service onboarding
- Full CRM
- File uploads
- Embeddable widget

## Tenant Rules

- Every lead belongs to exactly one `client_id`.
- Intake pages resolve a single active client by slug.
- Dashboard may view all clients only behind the admin secret.
- API writes and tenant-specific updates include both `lead.id` and `client_id` where practical.

## AI Rules

AI output must be structured JSON with:

- `summary`
- `fitScore`: `strong`, `medium`, or `weak`
- `missingInfo`
- `recommendedNextStep`

AI must not estimate renovation costs, promise timelines or availability, or provide legal, permit, construction-code, or warranty advice.
