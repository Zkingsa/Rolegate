# Rolegate Assignments

A focused React + Vite workspace for assigning rotating roles in recurring team rituals. The starter UI is ready for Supabase authentication and persistence.

## Getting started

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Add your Supabase project URL and anon key to `.env.local` before connecting the data layer. The SQL files in `supabase/` are intended to be run in this order:

1. `schema.sql`
2. `profile-trigger.sql`
3. `secure-policy.sql`
4. `promote-facilitator.sql`

`src/lib/supabaseClient.js` exports a configured client when both environment variables are present, and returns `null` when the app is running without Supabase credentials.

## Scripts

- `npm run dev` starts the local Vite server.
- `npm run build` creates a production build.
- `npm run preview` serves the production build locally.
