# Demo Hotel Operations Suite

Philippine small-hotel front desk demo. Amounts in **PHP (₱)**.

Built for **one person at the reception desk** — not for housekeeping on a tablet. HK still gets told by radio / Messenger; the desk updates room status afterward so the board matches reality.

## How a real shift uses it

1. **Check in** — tap a Ready room → guest name + nights (phone optional).
2. **During stay** — add charges (towels, late fee, minibar) on the folio from the same room panel.
3. **Check out** — collect GCash/Maya/cash/card → room flips to **Dirty**. Radio HK.
4. **When HK says done** — tap **Ready to sell**. No HK login required.
5. **Shift handover** — Leaving today, unpaid balances, and dirty rooms are at the top of Front Desk.

## Routes

| Route | Who |
|-------|-----|
| `/ops` | Front desk home (default) |
| `/reservations` | Future bookings |
| `/reports` | Owner glance (ADR / RevPAR) |
| `/billing/[id]` | Full receipt if needed |
| `/room/[n]` | Guest QR demo |
| `/requests` | Optional guest asks list |

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` → redirects to Front Desk.
