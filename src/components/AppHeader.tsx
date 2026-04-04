import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/dashboard", label: "Manager" },
  { href: "/frontdesk", label: "Front Desk" },
  { href: "/housekeeping", label: "Housekeeping" },
  { href: "/requests", label: "Requests Feed" },
  { href: "/room/108", label: "Guest QR Demo" },
];

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Harborlight Hotel Ops Demo
          </p>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
            Small Hotel Operations Console
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950 dark:border-slate-600 dark:text-slate-200"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
