"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HotelIcon } from "@/components/icons";
import { StaffShiftPicker } from "@/components/StaffShiftPicker";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/ops", label: "Ops" },
  { href: "/reservations", label: "Reservations" },
  { href: "/billing", label: "Billing" },
  { href: "/reports", label: "Reports" },
  { href: "/requests", label: "Requests" },
  { href: "/room/108", label: "Guest QR" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3.5">
        <Link href="/" className="group flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-deep text-gold shadow-sm sm:h-10 sm:w-10">
            <HotelIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="hotel-label text-gold">Demo Hotel</p>
            <h1 className="font-display truncate text-base font-semibold leading-tight text-navy sm:text-lg md:text-xl">
              Operations Suite
            </h1>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-app-nav"
          aria-label="Toggle navigation menu"
          className="hotel-btn hotel-btn-secondary min-h-11 min-w-11 px-3 lg:hidden"
        >
          <span className="text-sm">{isMenuOpen ? "Close" : "Menu"}</span>
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex xl:gap-1.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hotel-nav-link ${isActive(link.href) ? "hotel-nav-link-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <StaffShiftPicker />
          <ThemeToggle />
        </nav>
      </div>

      <nav
        id="mobile-app-nav"
        aria-label="Mobile primary"
        className={`${isMenuOpen ? "block" : "hidden"} border-t border-border px-3 py-3 sm:px-4 lg:hidden`}
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2 sm:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hotel-btn w-full justify-center text-center ${
                isActive(link.href) ? "hotel-btn-gold" : "hotel-btn-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="col-span-2 flex flex-col gap-2 sm:col-span-3 sm:flex-row">
            <StaffShiftPicker className="w-full flex-1 justify-between rounded-lg border border-border px-3 py-2" />
            <ThemeToggle className="w-full justify-center sm:w-auto" />
          </div>
        </div>
      </nav>
    </header>
  );
}
