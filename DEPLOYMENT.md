# Deployment: Vercel + Supabase

## Supabase setup
1. In Supabase, open SQL Editor and run `supabase/migrations/202611050001_initial_schema.sql`.
2. In Authentication > URL Configuration, set the Site URL to your Vercel production URL and add your Vercel preview URLs to Redirect URLs if needed.
3. Enable email/password authentication and set up email confirmation according to your launch requirements.
4. Copy the project URL and the anon/public key from Project Settings > API Keys. Never use the service-role key in the browser.

## Vercel setup
Add these Environment Variables for Production and Preview, then redeploy:
- `VITE_SUPABASE_URL` = `https://jefbqoimnzytamaaazjo.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = Supabase anon/public key
- `SUPABASE_URL` = same project URL
- `SUPABASE_ANON_KEY` = same anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase service-role/secret key (server only; keep private)
- `GEMINI_API_KEY` = optional server-side Gemini key

## Issue one-time activation licenses
Generate a unique, unpredictable license code for each purchase. In Supabase SQL Editor, insert its SHA-256 hash using the example at the bottom of the migration. Give the original code to the buyer through your trusted sales channel. The server verifies logged-in users and atomically marks a code as redeemed. Do not use shared demo codes or display fake QRIS/virtual-account details; connect a real payment provider separately before accepting payments online.

## Deployment checks
- Deploy the repository to Vercel with the repository root as the project root.
- Confirm `npm run build` succeeds and visit `/api/health`.
- Test email registration/login, verify that a logged-in user can save and load data, and confirm a second account cannot access the first account's row.
- Test one valid unused license, then confirm the same code cannot be redeemed again.
- The service-role key is highly privileged. Rotate it immediately if it was ever committed, shared publicly, or entered into frontend settings.
