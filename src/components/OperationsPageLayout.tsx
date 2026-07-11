import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";

interface OperationsPageLayoutProps {
  title: string;
  subtitle: string;
  maxWidthClass?: string;
  children: ReactNode;
  topSlot?: ReactNode;
}

export function OperationsPageLayout({
  title,
  subtitle,
  maxWidthClass = "max-w-6xl",
  children,
  topSlot,
}: OperationsPageLayoutProps) {
  return (
    <div className="hotel-page">
      <AppHeader />
      <main id="main-content">
        <section className={`mx-auto w-full px-4 pt-8 sm:px-6 ${maxWidthClass}`}>
          <div className="mb-1">
            <p className="hotel-label text-gold">Staff Console</p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-navy sm:text-4xl">
              {title}
            </h2>
            <div className="hotel-divider mt-4 max-w-xs" />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {subtitle}
            </p>
          </div>
          {topSlot}
        </section>
        {children}
      </main>
    </div>
  );
}
