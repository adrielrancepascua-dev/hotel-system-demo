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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-deep text-gold shadow-sm">
            <HotelIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="hotel-label text-gold">Demo Hotel</p>
            <h1 className="font-display text-lg font-semibold leading-tight text-navy sm:text-xl">
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
          className="hotel-btn hotel-btn-secondary min-h-11 min-w-11 px-3 md:hidden"
        >
          <span className="text-sm">{isMenuOpen ? "Close" : "Menu"}</span>
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-1.5 lg:flex">
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
        className={`${isMenuOpen ? "block" : "hidden"} border-t border-border px-4 py-3 lg:hidden`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hotel-btn w-full justify-start ${
                isActive(link.href) ? "hotel-btn-gold" : "hotel-btn-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <StaffShiftPicker className="w-full justify-between rounded-lg border border-border px-3 py-2" />
          <ThemeToggle className="w-full justify-center" />
        </div>
      </nav>
    </header>
  );
}
