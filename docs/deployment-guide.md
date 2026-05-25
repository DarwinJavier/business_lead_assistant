# Deployment Guide

## 1. Install And Verify Locally

```bash
npm install
npm run typecheck
npm run test
npm run build
```

On Windows PowerShell, use `npm.cmd` if script execution blocks `npm.ps1`.

## 2. Supabase

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Copy the project URL and service role key.

The app uses the service role key only on the server. Do not expose it in browser code.

Until Supabase is configured, the app runs in local demo mode. Demo submissions are stored in memory only and are cleared when the dev server restarts.

## 3. Resend

1. Create or verify a sending domain.
2. Create an API key.
3. Set `RESEND_FROM_EMAIL` to a verified sender.

## 4. OpenAI

1. Create an API key.
2. Set `OPENAI_MODEL` to the preferred small structured-output model.
3. Keep prompt changes aligned with the guardrails in `lib/prompts.ts`.

## 5. Vercel

Set these environment variables:

- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PRODUCT_OWNER_EMAIL`
- `ADMIN_DASHBOARD_SECRET`

Deploy staging first, submit one test lead for each pilot client, then promote to production.

## 6. Smoke Test

- Open each `/intake/[clientSlug]` page.
- Submit a realistic test lead.
- Confirm the lead exists in Supabase.
- Confirm AI fields are populated or gracefully marked failed.
- Confirm contractor and homeowner email events exist.
- Open `/dashboard?admin_key=YOUR_SECRET` and verify filters.
