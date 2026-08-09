"use client";

import { ToastProvider } from "@/components/Toast";
import { DemoStoreProvider } from "@/lib/store/DemoStore";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoStoreProvider>
      <ToastProvider>{children}</ToastProvider>
    </DemoStoreProvider>
  );
}
