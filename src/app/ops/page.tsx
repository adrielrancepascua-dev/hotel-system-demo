import { AppHeader } from "@/components/AppHeader";
import { UnifiedOpsBoard } from "@/components/UnifiedOpsBoard";

export default function OpsPage() {
  return (
    <div className="hotel-page">
      <AppHeader />
      <main id="main-content">
        <UnifiedOpsBoard />
      </main>
    </div>
  );
}
