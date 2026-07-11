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
    href: "/dashboard",
    title: "Manager Dashboard",
    description: "Oversee occupancy, turnover metrics, and cross-department room status at a glance.",
    icon: DashboardIcon,
    accent: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20",
  },
  {
    href: "/frontdesk",
    title: "Front Desk",
    description: "Check guests in and out, manage reservations, and flag maintenance needs.",
    icon: KeyIcon,
    accent: "from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/30",
  },
  {
    href: "/housekeeping",
    title: "Housekeeping",
    description: "Track cleaning progress, mark rooms ready, and report issues in real time.",
    icon: SparkleIcon,
    accent: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20",
  },
  {
    href: "/requests",
    title: "Request Feed",
    description: "View incoming guest requests and mark tasks complete as your team responds.",
    icon: BellIcon,
    accent: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",
  },
  {
    href: "/room/108",
    title: "Guest Concierge",
    description: "Mobile QR experience — guests tap to request towels, food, or hotel services.",
    icon: QrIcon,
    accent: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20",
  },
];

const highlights = [
  "Real-time sync across all staff dashboards",
  "Color-coded room status at a glance",
  "Guest QR concierge with instant staff delivery",
  "Works offline in demo mode — no setup required",
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
              Seamless hospitality,
              <span className="block text-gold-light">from lobby to guest room.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Harborlight&apos;s operations suite connects front desk, housekeeping, and guest
              concierge into one elegant, real-time workflow — built for small hotels that care
              about every detail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="hotel-btn hotel-btn-gold">
                <DashboardIcon className="h-4 w-4" />
                Launch Dashboard
              </Link>
              <Link
                href="/room/108"
                className="hotel-btn border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              >
                <ConciergeIcon className="h-4 w-4" />
                Try Guest QR
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="hotel-label">Staff Portals</p>
              <h3 className="font-display mt-1 text-2xl font-semibold text-navy">
                Choose your workspace
              </h3>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portals.map((portal) => (
              <Link key={portal.href} href={portal.href} className="group">
                <article className={`hotel-feature-card hotel-card-accent h-full bg-gradient-to-br ${portal.accent}`}>
                  <div className="hotel-feature-icon">
                    <portal.icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 font-display text-xl font-semibold text-navy group-hover:text-gold transition-colors">
                    {portal.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{portal.description}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gold opacity-0 transition-opacity group-hover:opacity-100">
                    Open portal →
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="hotel-card hotel-card-accent p-6 sm:p-8">
            <p className="hotel-label">How it works</p>
            <h3 className="font-display mt-1 text-2xl font-semibold text-navy">
              A complete demo workflow
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
            <p className="mt-6 text-sm text-muted">
              Open multiple staff pages in separate browser tabs and perform an action to see
              instant synchronization across the entire property.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
