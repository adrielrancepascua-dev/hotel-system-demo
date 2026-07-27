import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { BillingPanel } from "@/components/BillingPanel";

export default function BillingPage() {
  return (
    <OperationsPageLayout
      title="Billing & Guest Bills"
      subtitle="Room rates, extra charges, payments, and receipts."
    >
      <BillingPanel />
    </OperationsPageLayout>
  );
}
