import type { ReactNode } from "react";

interface OperationsPageLayoutProps {
  subtitle: string;
  maxWidthClass?: string;
  children: ReactNode;
  topSlot?: ReactNode;
}

/** Content shell for staff screens. Header lives in `(staff)/layout.tsx`. */
export function OperationsPageLayout({
  subtitle,
  maxWidthClass = "max-w-6xl",
  children,
  topSlot,
}: OperationsPageLayoutProps) {
  return (
    <main id="main-content" className="hotel-page-enter">
      <section
        className={`mx-auto w-full px-3 pt-3 sm:px-6 sm:pt-5 ${maxWidthClass}`}
      >
        <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
        {topSlot}
      </section>
      {children}
    </main>
  );
}
