import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { BillingPanel } from "@/components/BillingPanel";

export default function BillingPage() {
  return (
    <OperationsPageLayout
      title="Bills"
      subtitle="Guest bills, extra charges, payments, and receipts."
    >
      <BillingPanel />
    </OperationsPageLayout>
  );
}
