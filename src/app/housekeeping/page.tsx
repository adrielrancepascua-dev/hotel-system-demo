import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { RoomOperationsBoard } from "@/components/RoomOperationsBoard";

export default function HousekeepingPage() {
  return (
    <OperationsPageLayout
      title="Housekeeping Console"
      subtitle="Move rooms through cleaning and report issues in real time."
    >
      <RoomOperationsBoard mode="housekeeping" />
    </OperationsPageLayout>
  );
}
