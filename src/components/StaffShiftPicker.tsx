"use client";

import { useDemoStore } from "@/lib/store/DemoStore";

/** Only people who actually sit at the desk — HK doesn't use this system */
export function StaffShiftPicker({ className = "" }: { className?: string }) {
  const { state, setActiveStaff } = useDemoStore();
  const deskStaff = state.staff.filter(
    (s) => s.role === "frontdesk" || s.role === "manager",
  );
  const value =
    deskStaff.some((s) => s.id === state.activeStaffId)
      ? state.activeStaffId
      : (deskStaff[0]?.id ?? "");

  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted lg:inline">
        At desk
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => setActiveStaff(Number(e.target.value))}
        className="min-h-10 max-w-[12rem] rounded-lg border border-border bg-surface px-2 py-1.5 text-sm font-medium text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 sm:max-w-none"
        aria-label="Who is at the front desk"
      >
        {deskStaff.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
    </label>
  );
}
