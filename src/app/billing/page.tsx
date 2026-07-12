import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { BillingPanel } from "@/components/BillingPanel";

export default function BillingPage() {
  return (
    <OperationsPageLayout
      title="Billing & Folios"
      subtitle="Room rates, incidental charges, payments, and receipts — the financial spine of the stay."
    >
      <BillingPanel />
    </OperationsPageLayout>
  );
}
