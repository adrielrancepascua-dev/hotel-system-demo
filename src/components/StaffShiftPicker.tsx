"use client";

import { staffRoleLabels } from "@/lib/constants";
import { useActiveStaff, useDemoStore } from "@/lib/store/DemoStore";

export function StaffShiftPicker({ className = "" }: { className?: string }) {
  const { state, setActiveStaff } = useDemoStore();
  const active = useActiveStaff();

  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted lg:inline">
        On shift
      </span>
      <select
        value={state.activeStaffId ?? ""}
        onChange={(e) => setActiveStaff(Number(e.target.value))}
        className="min-h-10 max-w-[11rem] rounded-lg border border-border bg-surface px-2 py-1.5 text-sm font-medium text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 sm:max-w-none"
        aria-label="Staff on shift"
      >
        {state.staff.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} · {staffRoleLabels[member.role]}
          </option>
        ))}
      </select>
      {active && (
        <span className="sr-only">
          Currently on shift: {active.name}, {staffRoleLabels[active.role]}
        </span>
      )}
    </label>
  );
}
