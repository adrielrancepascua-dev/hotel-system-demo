import { GuestLinksPanel } from "@/components/GuestLinksPanel";
import { OperationsPageLayout } from "@/components/OperationsPageLayout";

export default function GuestLinksPage() {
  return (
    <OperationsPageLayout subtitle="Open or copy the page each guest sees in their room. Print it as a QR code and put it on the bedside table.">
      <GuestLinksPanel />
    </OperationsPageLayout>
  );
}
