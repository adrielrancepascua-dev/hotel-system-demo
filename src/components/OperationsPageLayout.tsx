import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";

interface OperationsPageLayoutProps {
  subtitle: string;
  maxWidthClass?: string;
  children: ReactNode;
  topSlot?: ReactNode;
}

/** Every staff screen uses this shell so the app feels like one tool. */
export function OperationsPageLayout({
  subtitle,
  maxWidthClass = "max-w-6xl",
  children,
  topSlot,
}: OperationsPageLayoutProps) {
  return (
    <div className="hotel-page">
      <AppHeader />
      <main id="main-content">
        <section
          className={`mx-auto w-full px-3 pt-3 sm:px-6 sm:pt-5 ${maxWidthClass}`}
        >
          <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
          {topSlot}
        </section>
        {children}
      </main>
    </div>
  );
}
