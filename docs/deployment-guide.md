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

Set these environment variables in the Vercel project. Add them to Preview and Production unless you intentionally want separate staging values.

| Variable | Required for V1 | Where it comes from | Notes |
|---|---:|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Vercel deployment URL or custom domain | This is public. Use the final app URL in production. |
| `SUPABASE_URL` | Yes | Supabase project settings | Project URL. Server-side use in this app. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase API settings | Secret. Never expose in browser code or `NEXT_PUBLIC_` variables. |
| `OPENAI_API_KEY` | Yes | OpenAI platform | Secret. Used to create AI lead summaries. |
| `OPENAI_MODEL` | Yes | App configuration | Default recommendation for V1: `gpt-4.1-mini`. |
| `RESEND_API_KEY` | Yes | Resend API keys | Secret. Used to send contractor and homeowner emails. |
| `RESEND_FROM_EMAIL` | Yes | Resend verified sender/domain | Example: `Business Lead Assistant <intake@yourdomain.com>`. |
| `ADMIN_DASHBOARD_SECRET` | Yes | You create it | Secret. Use a long random value. This protects the V1 dashboard. |
| `PRODUCT_OWNER_EMAIL` | Reserved | You create it | Optional for now. The current app does not actively use it yet. |

Do not copy local placeholder values into production. In particular, replace `ADMIN_DASHBOARD_SECRET` with a long private value before deploying.

Deploy staging first, submit one test lead for each pilot client, then promote to production.

## 6. Smoke Test

- Open each `/intake/[clientSlug]` page.
- Submit a realistic test lead.
- Confirm the lead exists in Supabase.
- Confirm AI fields are populated or gracefully marked failed.
- Confirm contractor and homeowner email events exist.
- Open `/dashboard?admin_key=YOUR_SECRET` and verify filters.
