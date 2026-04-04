import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <AppHeader />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Demo Workflow
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
            Hotel Operations System
          </h2>
          <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
            This demo shows front desk and housekeeping room status operations,
            live updates across dashboards, guest QR concierge requests, and a
            staff request completion feed.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Open Manager Dashboard
            </Link>
            <Link
              href="/frontdesk"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Open Front Desk
            </Link>
            <Link
              href="/housekeeping"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Open Housekeeping
            </Link>
            <Link
              href="/requests"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Open Request Feed
            </Link>
            <Link
              href="/room/108"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Guest QR Example
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
