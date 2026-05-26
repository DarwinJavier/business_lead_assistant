# Business Lead Assistant

A multi-tenant AI-assisted lead intake app for small local service businesses, starting with renovation and home-service contractors. Business Lead Assistant gives each contractor a branded intake page, captures structured homeowner project details, summarizes each lead with AI, scores the lead fit, flags missing information, and sends professional email notifications.

The first version is built for a four-contractor pilot. The goal is not to create a generic chatbot. The goal is to turn vague project inquiries into clear, qualified project briefs that contractors can review quickly.

## Features

- **Client-specific intake pages:** Each contractor has a branded intake page at `/intake/[clientSlug]`.
- **Guided multi-step intake:** Homeowners provide project type, description, goals, location, timeline, rough budget range, photos, and preferred contact method.
- **Multi-tenant lead storage:** Every lead belongs to a `client_id`, so contractor data stays separated inside one shared app.
- **AI lead summary:** OpenAI generates a plain-language project summary, fit score, missing information, and recommended next step.
- **Fit scoring:** Leads are scored as `strong`, `medium`, or `weak` based on contractor preferences and lead completeness.
- **No unsafe AI advice:** The AI is instructed not to estimate renovation costs, promise timelines, or provide legal, permit, warranty, or construction-code advice.
- **Contractor notification emails:** Resend sends the contractor a lead summary and homeowner contact details.
- **Homeowner confirmation emails:** The homeowner receives a professional confirmation that their inquiry was received.
- **Lead photo support:** Optional project photos or drawings can be uploaded and stored in Supabase Storage.
- **Admin dashboard:** The product owner can review leads, filter by client, update lead stages, delete leads, and edit contractor profiles.
- **Simple admin protection:** Dashboard mutation APIs require `ADMIN_DASHBOARD_SECRET` in production.
- **Local demo mode:** Without Supabase credentials, submissions are stored in local memory for testing.

## Prerequisites

- Node.js 20+
- npm
- A Supabase project
- An OpenAI API key
- A Resend account and verified sender/domain
- A Vercel account for deployment
- A GitHub repository for source control and Vercel deployment

## Setup

Clone the repo:

    git clone https://github.com/YOUR_USERNAME/business-lead-assistant.git
    cd business-lead-assistant

Install dependencies:

    npm install

Configure environment variables:

    cp .env.example .env.local

On Windows PowerShell, use `Copy-Item` if `cp` is not available:

    Copy-Item .env.example .env.local

Then open `.env.local` and fill in your values:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | The app URL. Use `http://localhost:3000` locally and the Vercel URL in production. |
| `SUPABASE_URL` | Yes for production | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for production | Supabase service role key. Server-side only. Never expose in browser code. |
| `OPENAI_API_KEY` | Yes for AI summaries | OpenAI API key from platform.openai.com. |
| `OPENAI_MODEL` | Yes | Model used for structured lead summaries. Default: `gpt-4.1-mini`. |
| `RESEND_API_KEY` | Yes for emails | Resend API key. |
| `RESEND_FROM_EMAIL` | Yes for emails | Verified sender, for example `Business Lead Assistant <intake@yourdomain.com>`. |
| `ADMIN_DASHBOARD_SECRET` | Yes | Private admin key used to open and operate the dashboard. |
| `PRODUCT_OWNER_EMAIL` | Optional/currently reserved | Product owner notification email for future workflows. The current app does not actively use it yet. |

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. If the database was created before recent profile updates, also review and run the migration files in `supabase/`.
5. Copy the project URL into `SUPABASE_URL`.
6. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.

The schema creates:

- `clients`
- `leads`
- `lead_events`
- four pilot contractor client records
- row-level security policies for service-role access

For Version 1, the app uses the service role key only from server-side code. Do not place the service role key in any `NEXT_PUBLIC_` variable.

## OpenAI setup

1. Create an API key in the OpenAI platform.
2. Add it to `.env.local` as `OPENAI_API_KEY`.
3. Set `OPENAI_MODEL`, for example:

       OPENAI_MODEL=gpt-4.1-mini

The AI prompt lives in `lib/prompts.ts`. It is designed to summarize leads and recommend next steps without estimating costs, giving permit advice, or making timeline promises.

## Resend setup

1. Create or log into a Resend account.
2. Verify a sender or sending domain.
3. Create a Resend API key.
4. Add the API key to `RESEND_API_KEY`.
5. Add a verified sender to `RESEND_FROM_EMAIL`.

Example:

    RESEND_FROM_EMAIL="Business Lead Assistant <intake@yourdomain.com>"

For production, use a verified domain so contractor and homeowner emails have the best chance of arriving reliably.

## Admin dashboard setup

Set a strong admin secret:

    ADMIN_DASHBOARD_SECRET=replace-with-a-long-private-random-value

Open the dashboard with:

    /dashboard?admin_key=YOUR_SECRET

This is a simple Version 1 admin protection layer, not a full user login system. It is appropriate for a controlled pilot. If contractors later need their own dashboard accounts, replace this with real authentication.

## Run

Start the local development server:

    npm run dev

On Windows PowerShell, use:

    npm.cmd run dev

Then open:

    http://localhost:3000

Useful local URLs:

    http://localhost:3000/intake/northline-design-build
    http://localhost:3000/intake/clearspace-basements
    http://localhost:3000/intake/prime-coat-painting
    http://localhost:3000/intake/cedar-stone-outdoor
    http://localhost:3000/dashboard?admin_key=YOUR_SECRET

Without Supabase credentials, the app runs in local demo mode. Intake submissions are stored in memory and appear in the dashboard until the dev server restarts.

## Verify

Run the main checks before deployment:

    npm run test
    npm run typecheck
    npm run lint
    npm run build

On Windows PowerShell, use:

    npm.cmd run test
    npm.cmd run typecheck
    npm.cmd run lint
    npm.cmd run build

Do not run `next dev` and `next build` at the same time. Both write to the `.next` folder, which can produce confusing build errors.

## Vercel deployment

Recommended deployment flow:

1. Commit the project to Git.
2. Push the repository to GitHub.
3. Create a new Vercel project from the GitHub repo.
4. Add the required environment variables in Vercel.
5. Deploy a staging/preview build first.
6. Submit one realistic test lead for each pilot contractor.
7. Confirm Supabase records, AI summaries, contractor emails, homeowner emails, dashboard filters, and admin-protected actions.
8. Promote to production only after the end-to-end smoke test passes.

See `docs/deployment-guide.md` and `PLAN.md` for the deployment readiness roadmap.

## Project structure

    business-lead-assistant/
    |-- app/
    |   |-- page.tsx                         # Pilot home page
    |   |-- layout.tsx                       # Root layout and metadata
    |   |-- globals.css                      # Tailwind/global styles
    |   |
    |   |-- intake/
    |   |   `-- [clientSlug]/
    |   |       |-- page.tsx                  # Client-specific intake page
    |   |       `-- not-found.tsx             # Intake not-found state
    |   |
    |   |-- dashboard/
    |   |   `-- page.tsx                      # Admin dashboard
    |   |
    |   `-- api/
    |       |-- leads/
    |       |   |-- submit/
    |       |   |   `-- route.ts              # Public lead submission endpoint
    |       |   `-- [leadId]/
    |       |       `-- route.ts              # Admin lead update/delete endpoint
    |       |
    |       `-- clients/
    |           |-- profile/
    |           |   `-- route.ts              # Admin contractor profile save endpoint
    |           |-- fit-criteria/
    |           |   `-- route.ts              # Admin fit criteria endpoint
    |           `-- [clientId]/
    |               `-- route.ts              # Admin client delete endpoint
    |
    |-- components/
    |   |-- IntakeForm.tsx                    # Homeowner intake form
    |   |-- ClientBrandHeader.tsx             # Contractor branding header
    |   |-- DashboardTable.tsx                # Lead dashboard table
    |   |-- LeadFunnelControls.tsx            # Lead status/delete controls
    |   |-- ContractorProfileForm.tsx         # Contractor profile editor
    |   |-- LeadSummaryCard.tsx               # AI summary display
    |   `-- FitScoreBadge.tsx                 # Fit score display
    |
    |-- lib/
    |   |-- adminAuth.ts                      # Simple admin secret authorization
    |   |-- clients.ts                        # Client lookup helpers
    |   |-- supabase.ts                       # Supabase server client
    |   |-- openai.ts                         # OpenAI structured summary call
    |   |-- prompts.ts                        # AI lead summary prompt
    |   |-- resend.ts                         # Resend email sending
    |   |-- emailTemplates.ts                 # Contractor/homeowner email HTML
    |   |-- validation.ts                     # Intake validation schema
    |   |-- leadScoring.ts                    # AI summary validation/fallbacks
    |   |-- rateLimit.ts                      # Basic intake rate limiting
    |   |-- localLeadStore.ts                 # Local demo-mode lead store
    |   `-- types.ts                          # Shared TypeScript types
    |
    |-- supabase/
    |   |-- schema.sql                        # Main production schema and seed clients
    |   |-- fit-criteria-migration.sql        # Fit criteria migration
    |   `-- contractor-profile-and-funnel-migration.sql
    |
    |-- tests/
    |   |-- adminAuth.test.ts
    |   |-- validation.test.ts
    |   |-- leadScoring.test.ts
    |   |-- emailTemplates.test.ts
    |   `-- rateLimit.test.ts
    |
    |-- docs/
    |   |-- product-spec.md
    |   |-- deployment-guide.md
    |   `-- client-onboarding.md
    |
    |-- PLAN.md                              # Product and deployment roadmap
    |-- .env.example                         # Environment variable template
    |-- package.json                         # Scripts and dependencies
    `-- README.md
