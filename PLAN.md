
---

## `plan.md`

```markdown
# PLAN.md

## Project Name

AI Renovation Lead Intake Assistant

## Version

Version 1

## Objective

Create a working multi-tenant AI-assisted intake platform for small local service businesses, starting with four construction / renovation contractors.

The first version should help contractors capture better homeowner inquiries, qualify leads faster, and create a more professional first impression.

The product should not replace the contractor’s website. It should act as an intelligent intake layer that can be linked from the existing website, contact page, Google Business Profile, or follow-up messages.

Primary objective:

> Build one reusable product that serves four initial contractor customers, while keeping each customer’s branding, leads, and notifications separate.

## Strategic Context

Small local contractors often receive vague inquiries such as:

- “How much to redo my basement?”
- “Can you renovate my kitchen?”
- “Do you do decks?”
- “Can I get a quote?”

These inquiries often lack the information needed to decide whether the lead is serious or worth immediate follow-up.

Contractors need better intake, not another generic marketing tool.

This product helps by turning vague inquiries into structured project briefs.

## Value Proposition

### For contractors

> Turn vague homeowner inquiries into clear, qualified project conversations.

Benefits:

- Better lead details before the first call
- Faster lead triage
- Fewer wasted conversations
- More professional homeowner experience
- Better follow-up discipline
- Centralized lead records
- AI-generated summaries and next steps

### For homeowners

> A simple guided way to explain your renovation project before speaking with the contractor.

Benefits:

- Less confusion
- Clearer expectations
- Easier first step
- Better chance of getting a relevant response

### For the product owner

> A reusable local-business AI intake platform that can begin with contractors and later adapt to other small-business archetypes.

Future archetypes:

- Dental clinics
- Physiotherapy clinics
- Cleaning companies
- Restaurants / catering
- Salons
- Automotive shops
- Professional service providers

## Version 1 Customer Scope

Version 1 supports four initial contractor clients.

Examples:

1. Renovation / design-build contractor
2. Basement contractor
3. Painting contractor
4. Landscaping or deck contractor

Each client should have:

- Business name
- Slug
- Brand color
- Logo URL, optional
- Notification email
- Phone number
- Website URL
- Service area
- Project types

## Product Architecture

Version 1 should use a multi-tenant architecture.

This means:

> One shared software system serves multiple customers, while keeping each customer’s data and experience separate.

Shared infrastructure:

- One Next.js app
- One Vercel deployment
- One Supabase project
- One OpenAI API integration
- One Resend email integration
- One codebase

Tenant-specific data:

- Branding
- Intake page
- Project types
- Notification email
- Leads
- Lead statuses
- AI summaries

Every lead must include a `client_id`.

## High-Level Flow

```text
Homeowner visits client intake page
        |
        v
/intake/[clientSlug]
        |
        v
Homeowner completes guided form
        |
        v
Lead is saved to Supabase
        |
        v
OpenAI generates structured summary
        |
        v
Lead record is updated
        |
        v
Contractor receives email notification
        |
        v
Homeowner receives confirmation email
        |
        v
Admin dashboard shows the lead

## Current Status

The Version 1 application is substantially built and working locally:

- Next.js App Router application is in place.
- Multi-tenant intake pages exist at `/intake/[clientSlug]`.
- Supabase integration is implemented for clients, leads, lead events, and uploaded lead photos.
- OpenAI lead summaries, fit scores, missing information, and recommended next steps are implemented.
- Resend email notifications are implemented for contractors and homeowners.
- A basic dashboard exists for reviewing leads, updating funnel status, deleting leads, and editing contractor profile settings.
- Automated tests, linting, and TypeScript checks are passing locally.

The next phase is deployment readiness: making sure the app is safe, repeatable, and stable before it is put on a public URL.

## Deployment Readiness Roadmap

Work through these steps one at a time. Each step includes what it means, what Codex can do, and what the product owner may need to provide.

### 1. Fix the production build

Why this matters:

Vercel runs a production build before deploying the app. If `npm run build` fails locally, deployment will likely fail too.

Current finding:

- `npm.cmd run test` passes.
- `npm.cmd run typecheck` passes.
- `npm.cmd run lint` passes.
- `npm.cmd run build` passes after stopping local Next.js dev servers that were writing to `.next` during the production build.

Beginner note:

Do not run `next dev` and `next build` at the same time in this project. The dev server and production build both use the `.next` folder. If both are active, build output can become inconsistent and produce confusing missing-module errors.

What Codex will do:

- Investigate the Next.js build error.
- Check whether the issue is caused by stale build output, route structure, Next.js version behavior, or a missing app-level `not-found.tsx`.
- Make the smallest safe code/config change needed.
- Re-run `npm.cmd run build` until it passes.

What the product owner needs to do:

- Nothing at first. Codex can investigate this locally.

Definition of done:

- `npm.cmd run build` completes successfully.

Status:

- Complete as of the latest local check.

### 2. Protect dashboard mutation APIs

Why this matters:

The dashboard page is protected by `ADMIN_DASHBOARD_SECRET`, but the API routes used by the dashboard also need server-side protection. A public deployment should not allow someone to update contractor settings, change lead statuses, or delete leads by calling API endpoints directly.

Routes to protect:

- `POST /api/clients/profile`
- `POST /api/clients/fit-criteria`
- `DELETE /api/clients/[clientId]`
- `PATCH /api/leads/[leadId]`
- `DELETE /api/leads/[leadId]`

What Codex will do:

- Add a small shared admin authorization helper.
- Require the admin secret for dashboard mutation requests.
- Update the dashboard frontend to send the secret safely enough for Version 1.
- Add focused tests if practical.
- Re-run lint, typecheck, tests, and build.

What the product owner needs to provide:

- A strong `ADMIN_DASHBOARD_SECRET` value before deployment.

Definition of done:

- Dashboard mutations work when authorized.
- Dashboard mutations fail when the admin secret is missing or wrong.

Status:

- Complete as of the latest local check.
- Added a shared admin authorization helper.
- Dashboard profile saves, business deletion, lead status updates, and lead deletion now send the admin key.
- Protected dashboard mutation API routes now reject unauthorized production requests.
- Added tests for the admin authorization helper.
- Verified with `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run build`.

### 3. Put the project under Git source control

Why this matters:

Vercel works best when connected to a GitHub repository. Git also gives us a safety net: we can track changes, roll back mistakes, and deploy from a clean commit.

What Codex can do:

- Check whether this project is already meant to connect to an existing GitHub repository.
- Initialize Git locally if needed.
- Confirm `.env`, `.env.local`, `.next`, and `node_modules` are ignored.
- Help prepare the first commit.

What the product owner needs to provide:

- Whether to create a new GitHub repository or use an existing one.
- GitHub account access.

Definition of done:

- The project is committed to Git.
- The repository is available on GitHub.

Status:

- Complete.
- GitHub remote is configured at `https://github.com/DarwinJavier/business_lead_assistant.git`.
- Main branch is `main`.
- Continue committing and pushing after each deployment-readiness change.

### 4. Confirm production environment variables

Why this matters:

Local `.env` files do not automatically exist on Vercel. Every secret or production setting must be added to the Vercel project.

Required variables:

- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ADMIN_DASHBOARD_SECRET`
- `PRODUCT_OWNER_EMAIL` (reserved/optional for now)

What Codex will do:

- Confirm which variables the code actually uses.
- Update `.env.example` and docs if anything is outdated.
- Explain where each value comes from.

What the product owner needs to provide:

- Supabase project URL and service role key.
- OpenAI API key.
- Resend API key and verified sender email.
- Production app URL after Vercel creates it.
- Admin dashboard secret.

Definition of done:

- Vercel has all required environment variables set for production.

Status:

- Required variable list is confirmed against the current code.
- `.env.example`, `README.md`, and `docs/deployment-guide.md` have been updated.
- `PRODUCT_OWNER_EMAIL` is documented as optional/reserved because the current app does not actively use it yet.
- Remaining action: add the real values in Vercel after the Vercel project is created.

### 5. Prepare the Supabase production database

Why this matters:

The production app needs real database tables, policies, seed clients, and storage support before real users submit leads.

What Codex will do:

- Review `supabase/schema.sql` and migration files.
- Confirm whether the latest schema includes every field the app expects.
- Help produce a clean set of SQL steps for Supabase.
- Confirm photo storage bucket behavior.

What the product owner needs to do:

- Create or choose the production Supabase project.
- Run SQL in the Supabase SQL editor, or allow Codex to guide each step.
- Replace demo contractor emails with real notification emails before live testing.

Definition of done:

- Production Supabase has the required tables, policies, clients, and storage behavior.
- A test lead can be saved to production Supabase.

### 6. Prepare Resend for real email delivery

Why this matters:

Email can work locally with a test sender, but production delivery requires a verified sender or domain. This affects whether contractors and homeowners actually receive messages.

What Codex will do:

- Confirm the app's Resend usage.
- Explain the difference between a test sender and a verified domain.
- Help verify the expected `RESEND_FROM_EMAIL` format.

What the product owner needs to do:

- Create or access a Resend account.
- Verify a sending domain or approved sender.
- Add DNS records if using a custom domain.

Definition of done:

- Contractor notification emails and homeowner confirmation emails arrive from the production app.

### 7. Deploy to Vercel staging first

Why this matters:

Staging lets us test the real hosted app without treating it as final production. It is the dress rehearsal.

What Codex will do:

- Help connect the GitHub repository to Vercel.
- Confirm the build command and framework settings.
- Help inspect deployment logs if anything fails.

What the product owner needs to do:

- Log in to Vercel.
- Connect the GitHub repository.
- Add environment variables.

Definition of done:

- Vercel produces a working deployment URL.
- The deployment build succeeds.

### 8. Run end-to-end smoke tests

Why this matters:

The app is only deployment-ready when the complete journey works, not just the build.

Smoke test checklist:

- Open each pilot client's intake page.
- Submit one realistic test lead per client.
- Confirm each lead appears in Supabase.
- Confirm AI summary fields are populated, or failure is logged gracefully.
- Confirm contractor email notification arrives.
- Confirm homeowner confirmation email arrives.
- Confirm uploaded photos, if tested, produce dashboard links.
- Open `/dashboard?admin_key=YOUR_SECRET`.
- Confirm filtering, status updates, and lead deletion work only when authorized.

What Codex will do:

- Provide test scenarios.
- Help interpret errors.
- Fix any issues found during smoke testing.

What the product owner needs to do:

- Check real email inboxes.
- Confirm that client names, branding, service areas, and notification emails are correct.

Definition of done:

- One full intake-to-dashboard-to-email loop works for every pilot client.

### 9. Promote to production

Why this matters:

Production is the version real contractors and homeowners will use.

What Codex will do:

- Help confirm final environment variables.
- Help confirm the production URL and dashboard URL.
- Help prepare a small launch checklist for the first four contractor pilots.

What the product owner needs to do:

- Decide the production URL or custom domain.
- Decide who receives initial lead notifications.
- Share intake links with pilot contractors only after smoke tests pass.

Definition of done:

- The production app is live.
- Pilot contractor intake links are ready to share.

## Immediate Next Step

Start with Step 3: put the project under Git source control.

This is the correct next step because the app now builds and dashboard actions have server-side protection. A Git repository gives us a clean deployment path to Vercel and a safety net for future changes.
