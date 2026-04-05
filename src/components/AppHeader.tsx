"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/dashboard", label: "Manager" },
  { href: "/frontdesk", label: "Front Desk" },
  { href: "/housekeeping", label: "Housekeeping" },
  { href: "/requests", label: "Requests Feed" },
  { href: "/room/108", label: "Guest QR Demo" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const linkClass =
    "inline-flex min-h-11 items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:text-slate-200 dark:focus-visible:ring-slate-300";

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Harborlight Hotel Ops Demo
          </p>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
            Small Hotel Operations Console
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-app-nav"
          aria-label="Toggle navigation menu"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 md:hidden dark:border-slate-600 dark:text-slate-200 dark:focus-visible:ring-slate-300"
        >
          Menu
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-2 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>

      <nav
        id="mobile-app-nav"
        aria-label="Mobile primary"
        className={`${isMenuOpen ? "block" : "hidden"} border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-700`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block min-h-11 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-300"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle className="w-full justify-center rounded-xl" />
        </div>
      </nav>
    </header>
  );
}
