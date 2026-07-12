"use client";

import { DemoStoreProvider } from "@/lib/store/DemoStore";

export function Providers({ children }: { children: React.ReactNode }) {
  return <DemoStoreProvider>{children}</DemoStoreProvider>;
}
