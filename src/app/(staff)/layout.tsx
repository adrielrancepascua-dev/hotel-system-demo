import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";

/**
 * Shared staff chrome. Keeping the header here (not in each page) means the
 * theme toggle and nav stay mounted when switching tabs — no remount jitter.
 */
export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="hotel-page">
      <AppHeader />
      {children}
    </div>
  );
}
