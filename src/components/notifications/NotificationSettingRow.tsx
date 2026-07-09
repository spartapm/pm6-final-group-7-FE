"use client";

import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import type { NotificationType } from "@/lib/types";

interface NotificationSettingRowProps {
  icon: string;
  iconBg: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  showDivider?: boolean;
}

export function NotificationSettingRow({
  icon,
  iconBg,
  label,
  description,
  checked,
  onChange,
  showDivider = false,
}: NotificationSettingRowProps) {
  return (
    <div className={`flex items-center gap-3 px-5 py-4 ${showDivider ? "border-t border-gray-100" : ""}`}>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-bold text-[#1c1c27]">{label}</p>
        <p className="mt-0.5 text-[15px] leading-snug text-[#9096a6]">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={() => onChange()} aria-label={`${label} 알림`} />
    </div>
  );
}

export function NotificationSettingsSectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <p className="px-5 pb-1 pt-4 text-[14px] font-bold text-[#9096a6]">{title}</p>
      {children}
    </section>
  );
}