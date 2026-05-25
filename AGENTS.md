# AGENTS.md

## Project Name

AI Renovation Lead Intake Assistant

## Objective

Build Version 1 of a multi-tenant AI-assisted lead intake platform for small local service businesses, starting with four construction / renovation contractors.

The first version should help contractor businesses capture better project inquiries from homeowners, summarize those inquiries with AI, score the fit of each lead, identify missing information, and notify the contractor by email.

The goal is not to build a generic chatbot. The goal is to build a structured, professional intake system that helps contractors turn vague homeowner inquiries into clear project briefs.

Core outcome:

> Fewer vague inquiries. Faster lead qualification. Better first impression with homeowners.

## Target Users

### Primary user: contractor / business owner

The first customer type is an owner-operated or small-team construction business.

Examples:

- Renovation contractor
- Design-build contractor
- Basement renovation company
- Kitchen and bathroom renovation company
- Deck / patio contractor
- Painting contractor
- Landscaping contractor

Version 1 assumes four initial contractor customers.

### Secondary user: homeowner

The homeowner uses the intake page to describe a renovation or home improvement project.

They should feel guided, not interrogated.

The intake experience should help them explain:

- What they want done
- Why they want it done
- Where the project is located
- Their timeline
- Their rough budget range
- Whether they have photos or drawings
- How they want to be contacted

## Long-Term Vision

The first version is focused on construction and renovation contractors, but the architecture should be adaptable to other small-business archetypes later.

Future verticals may include:

- Dental clinics
- Physiotherapy clinics
- Optometry clinics
- Cleaning companies
- Local restaurants / catering businesses
- Salons / spas
- Automotive repair shops
- Professional services
- Home inspection businesses
- Real estate services

Do not hard-code the product so tightly around renovation that it cannot later support other local business types.

Use configurable client settings wherever practical.

## Value Proposition

For local contractors:

> We help local renovation and home-service businesses turn vague homeowner inquiries into clear, qualified project conversations using better intake, AI-powered lead summaries, and professional follow-up workflows.

For homeowners:

> A clearer and easier way to explain your renovation project before the first call.

For the business owner:

> Spend less time decoding vague inquiries and more time talking to serious prospects.

## Product Principles

1. Build for clarity, not gimmicks.
2. Avoid calling it a chatbot in the UX unless needed.
3. Use structured intake first, AI second.
4. Do not allow AI to estimate renovation costs.
5. Do not allow AI to provide legal, permit, warranty, or construction-code advice.
6. Do not promise timelines or availability.
7. Keep the contractor in control.
8. Keep Version 1 simple enough to deploy and maintain.
9. Optimize for a working pilot with four contractor customers.
10. Design the system as multi-tenant from the beginning.

## Multi-Tenant Definition

This product should use one shared application and infrastructure stack to serve multiple customers.

Each customer should have:

- Their own intake page
- Their own branding
- Their own notification email
- Their own lead records
- Their own settings
- Their own project types
- Their own dashboard view later

Shared infrastructure:

- One Next.js app
- One Vercel deployment
- One Supabase project
- One OpenAI API integration
- One Resend email integration
- One shared codebase

Every lead must belong to a `client_id`.

No customer should ever see another customer’s leads.

## Version 1 Scope

Version 1 should include:

- Client-specific intake pages at `/intake/[clientSlug]`
- Multi-step project intake form
- Supabase database
- OpenAI-generated lead summary
- AI fit score: `strong`, `medium`, or `weak`
- Missing information flags
- Recommended next step
- Contractor email notification
- Homeowner confirmation email
- Basic admin dashboard for the product owner
- Four configured contractor demo/pilot clients

Version 1 should not include:

- Full website builder
- Full CRM
- SMS
- Payment collection
- Client billing
- Client self-service onboarding
- Complex chatbot memory
- Voice assistant
- Live chat handoff
- Permit advice
- Quote estimation
- Legal advice
- Warranty advice
- Full embeddable widget
- Client login unless simple and safe

## Recommended Technology Stack

### Frontend and app framework

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components if practical

### Hosting

Use:

- Vercel

### Database

Use:

- Supabase Postgres

### AI

Use:

- OpenAI API
- Structured JSON output for lead summary and scoring

### Email

Use:

- Resend

### File storage

For Version 1, file uploads are optional.

If implemented, use:

- Supabase Storage

If skipped, ask homeowners whether they have photos and tell them the contractor may request photos later.

## Suggested Project Structure

```text
renovation-lead-intake/
  app/
    page.tsx
    intake/
      [clientSlug]/
        page.tsx
    dashboard/
      page.tsx
    api/
      leads/
        submit/
          route.ts
      ai/
        summarize-lead/
          route.ts
  components/
    IntakeForm.tsx
    IntakeStep.tsx
    LeadSummaryCard.tsx
    FitScoreBadge.tsx
    DashboardTable.tsx
    ClientBrandHeader.tsx
  lib/
    supabase.ts
    openai.ts
    resend.ts
    prompts.ts
    leadScoring.ts
    validation.ts
    emailTemplates.ts
  supabase/
    schema.sql
  docs/
    product-spec.md
    deployment-guide.md
    client-onboarding.md
  .env.example
  README.md