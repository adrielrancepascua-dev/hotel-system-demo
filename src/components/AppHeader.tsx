"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HotelIcon } from "@/components/icons";
import { StaffShiftPicker } from "@/components/StaffShiftPicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDemoStore } from "@/lib/store/DemoStore";

const links = [
  { href: "/ops", label: "Front Desk" },
  { href: "/reservations", label: "Bookings" },
  { href: "/billing", label: "Bills" },
  { href: "/requests", label: "Requests" },
  { href: "/reports", label: "Reports" },
  { href: "/guest-links", label: "Guest links" },
];

function titleForPath(pathname: string): string {
  if (pathname.startsWith("/reservations")) return "Bookings";
  if (pathname.startsWith("/billing")) return "Bills";
  if (pathname.startsWith("/requests")) return "Requests";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/guest-links")) return "Guest links";
  return "Front Desk";
}

export function AppHeader() {
  const pathname = usePathname();
  const { state, hydrated } = useDemoStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pageTitle = titleForPath(pathname);
  const waiting = hydrated
    ? state.requests.filter((r) => r.status === "pending").length
    : 0;

  // Adjusting during render rather than in an effect avoids a frame where the
  // menu is still open on the new page.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    if (!isMenuOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsMenuOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  function isActive(href: string) {
    if (href === "/ops") return pathname === "/ops" || pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function badgeFor(href: string) {
    if (href !== "/requests" || waiting === 0) return null;
    return (
      <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[0.625rem] font-bold text-navy-deep">
        {waiting}
      </span>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/95 print:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3.5">
          <Link
            href="/ops"
            className="flex min-w-0 items-center gap-2 active:opacity-80 sm:gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-deep text-gold shadow-sm sm:h-10 sm:w-10">
              <HotelIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="hotel-label text-gold">Demo Hotel</p>
              <h1 className="font-display truncate text-lg font-semibold leading-tight text-navy md:text-xl">
                {pageTitle}
              </h1>
            </div>
          </Link>

          <button
            type="button"
            data-open={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-app-nav"
            aria-label="Toggle navigation menu"
            className="hotel-btn hotel-btn-secondary min-h-11 min-w-11 gap-2 px-3 lg:hidden"
          >
            <span className="hotel-burger" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="text-sm">{isMenuOpen ? "Close" : "Menu"}</span>
            <span
              aria-hidden={isMenuOpen || waiting === 0}
              className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-gold text-[0.625rem] font-bold text-navy-deep transition-all duration-200 ease-out ${
                !isMenuOpen && waiting > 0
                  ? "min-w-5 max-w-8 scale-100 px-1.5 py-0.5 opacity-100"
                  : "max-w-0 scale-50 px-0 py-0 opacity-0"
              }`}
            >
              {waiting}
            </span>
          </button>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`hotel-nav-link ${isActive(link.href) ? "hotel-nav-link-active" : ""}`}
              >
                {link.label}
                {badgeFor(link.href)}
              </Link>
            ))}
            <StaffShiftPicker />
            <ThemeToggle className="min-w-[6.5rem]" />
          </nav>
        </div>

        <nav
          id="mobile-app-nav"
          aria-label="Mobile primary"
          data-open={isMenuOpen}
          inert={!isMenuOpen}
          className="hotel-collapse lg:hidden"
        >
          <div>
            <div className="border-t border-border px-3 py-3 sm:px-4">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`hotel-btn w-full justify-center text-center ${
                      isActive(link.href) ? "hotel-btn-gold" : "hotel-btn-secondary"
                    }`}
                  >
                    {link.label}
                    {badgeFor(link.href)}
                  </Link>
                ))}
                {/* Keep desk/theme controls outside stagger so the toggle never slides. */}
                <div className="col-span-2 flex flex-col gap-2 sm:flex-row">
                  <StaffShiftPicker className="w-full flex-1 justify-between rounded-lg border border-border px-3 py-2" />
                  <ThemeToggle className="w-full justify-center sm:min-w-[6.5rem] sm:w-auto" />
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div
        aria-hidden="true"
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 z-30 bg-navy-deep/40 transition-opacity duration-200 ease-out lg:hidden print:hidden ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
    </>
  );
}
