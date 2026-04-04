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
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <AppHeader />
      <section className={`mx-auto w-full px-4 pt-6 sm:px-6 ${maxWidthClass}`}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        {topSlot}
      </section>
      {children}
    </main>
  );
}
