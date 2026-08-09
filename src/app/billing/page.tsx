import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { BillingPanel } from "@/components/BillingPanel";

export default function BillingPage() {
  return (
    <OperationsPageLayout subtitle="Guest bills, extra charges, payments, and printable receipts.">
      <BillingPanel />
    </OperationsPageLayout>
  );
}
