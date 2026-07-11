# Harborlight Hotel Operations Demo

Demo hotel management system built with Next.js App Router, TypeScript, TailwindCSS, and Supabase.

## Features

- Room status dashboard with color-coded cards
- Front desk actions: check in, check out, mark reserved, report maintenance
- Housekeeping actions: start cleaning, finish cleaning, report issue
- Realtime room and request updates across pages via Supabase subscriptions
- Guest QR concierge flow at `/room/[roomNumber]`
- Staff request feed with mark-completed workflow
- Summary stats for occupied, ready, cleaning, maintenance, and needs cleaning

## Routes

- `/dashboard` Manager overview with role switcher
- `/frontdesk` Front desk action board
- `/housekeeping` Housekeeping action board
- `/room/[roomNumber]` Guest mobile concierge page
- `/requests` Staff request feed

## Database Setup (Supabase)

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

If env vars are missing, the app runs in local demo mode with generated room/request data.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Data

- Rooms: `101` to `120`
- Realistic status mix: ready, occupied, cleaning, needs cleaning, maintenance
- Sample guest requests included in SQL seed
- Placeholder guest names shown for occupied rooms
