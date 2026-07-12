import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import {
  BellIcon,
  ConciergeIcon,
  DashboardIcon,
  KeyIcon,
  QrIcon,
  SparkleIcon,
} from "@/components/icons";

const portals = [
  {
    href: "/ops",
    title: "Operations Console",
    description:
      "One board for check-in, checkout, cleaning, and maintenance — no role-tab hopping.",
    icon: DashboardIcon,
    accent: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20",
  },
  {
    href: "/reservations",
    title: "Reservations",
    description: "Guest stays with dates, contact details, and walk-in / OTA / phone sources.",
    icon: KeyIcon,
    accent: "from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/30",
  },
  {
    href: "/billing",
    title: "Billing & Folios",
    description: "Room rates, charges, payments, and printable receipts for every stay.",
    icon: SparkleIcon,
    accent: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20",
  },
  {
    href: "/reports",
    title: "Owner Reports",
    description: "Occupancy, ADR, RevPAR, and revenue — performance at a glance.",
    icon: BellIcon,
    accent: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",
  },
  {
    href: "/requests",
    title: "Request Feed",
    description: "Guest concierge requests with notes, photos, and staff attribution.",
    icon: ConciergeIcon,
    accent: "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20",
  },
  {
    href: "/room/108",
    title: "Guest Concierge",
    description: "Mobile QR experience — bill view, digital checkout, photo service requests.",
    icon: QrIcon,
    accent: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20",
  },
];

const highlights = [
  "Real reservations with guest capture and stay dates",
  "Folio billing with rates, payments, and receipts",
  "Room types: Standard, Deluxe, Suite with nightly rates",
  "Unified Ops — front desk and housekeeping on one board",
  "Owner metrics: occupancy, ADR, RevPAR, revenue",
  "Guest bill view, checkout request, and photo attachments",
];

export default function Home() {
  return (
    <div className="hotel-page">
      <AppHeader />
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="hotel-hero px-6 py-10 sm:px-10 sm:py-14">
          <div className="relative z-10 max-w-2xl">
            <p className="hotel-label text-gold-light">Boutique Hotel Operations</p>
            <h2 className="font-display mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl">
              From reservation to receipt,
              <span className="block text-gold-light">in one elegant suite.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Harborlight connects front desk, housekeeping, billing, and guest concierge —
              so your team acts on rooms by status, not by switching role tabs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ops" className="hotel-btn hotel-btn-gold">
                <DashboardIcon className="h-4 w-4" />
                Open Operations
              </Link>
              <Link
                href="/reports"
                className="hotel-btn border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              >
                View Reports
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="hotel-label">Workspaces</p>
            <h3 className="font-display mt-1 text-2xl font-semibold text-navy">
              Everything your property needs
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portals.map((portal) => (
              <Link key={portal.href} href={portal.href} className="group">
                <article
                  className={`hotel-feature-card hotel-card-accent h-full bg-gradient-to-br ${portal.accent}`}
                >
                  <div className="hotel-feature-icon">
                    <portal.icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 font-display text-xl font-semibold text-navy transition-colors group-hover:text-gold">
                    {portal.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {portal.description}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gold opacity-0 transition-opacity group-hover:opacity-100">
                    Open →
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="hotel-card hotel-card-accent p-6 sm:p-8">
            <p className="hotel-label">What&apos;s included</p>
            <h3 className="font-display mt-1 text-2xl font-semibold text-navy">
              Built for owner demos
            </h3>
            <div className="hotel-divider mt-4" />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-muted text-xs font-bold text-gold">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
