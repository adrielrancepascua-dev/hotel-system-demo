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
        <section className={`mx-auto w-full px-3 pt-4 sm:px-6 sm:pt-6 md:pt-8 ${maxWidthClass}`}>
          <div className="mb-1">
            <p className="hotel-label text-gold">Staff Console</p>
            <h2 className="font-display mt-0.5 text-2xl font-semibold text-navy sm:mt-1 sm:text-3xl md:text-4xl">
              {title}
            </h2>
            <div className="hotel-divider mt-2 max-w-[8rem] sm:mt-4 sm:max-w-xs" />
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:mt-3 sm:text-base">
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
