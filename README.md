# Demo Hotel Operations Suite

Philippine hotel management demo built with Next.js App Router, TypeScript, TailwindCSS, and optional Supabase. Amounts are in **PHP (₱)**.

## Features

- **Unified Operations console** — check-in, checkout, cleaning, and maintenance on one board (status-driven actions, no role-tab hopping)
- **Reservations** — guest name/contact, stay dates, source (walk-in / Agoda·Booking / phone)
- **Room types & rates** — Standard ₱2,500 · Deluxe ₱3,800 · Suite ₱5,500 per night
- **Billing / folios** — room charges, incidentals, GCash / Maya / card / cash payments, receipts
- **Staff shift picker** — attributes who completed cleaning and guest requests
- **Owner reports** — occupancy, ADR, RevPAR, revenue today/MTD
- **Guest QR concierge** — bill view, digital checkout, notes + photo attachments
- Demo mode persists in `localStorage` (no Supabase required)

## Routes

| Route | Purpose |
|-------|---------|
| `/ops` | Unified operations board |
| `/reservations` | Bookings list & create |
| `/billing` | Folios, charges, payments |
| `/billing/[id]` | Receipt / print view |
| `/reports` | Owner metrics |
| `/requests` | Staff request feed |
| `/room/[roomNumber]` | Guest mobile concierge |
| `/frontdesk`, `/housekeeping`, `/dashboard` | Redirect into `/ops` with filters |

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase (optional)

1. Run `supabase/schema.sql` in the SQL editor.
2. Copy env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Without env vars, the app uses the in-browser DemoStore.

## Demo tips

1. Set **On shift** staff in the header.
2. Open **Ops** → select a Ready room → **Check In Guest**.
3. Open **Billing** to take payment; open **Reports** to see ADR / RevPAR move.
4. Visit `/room/108` as the guest to view the bill and send photo requests.
