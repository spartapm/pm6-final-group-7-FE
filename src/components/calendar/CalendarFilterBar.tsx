"use client";

import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

const FILTERS = [
  { id: "all", label: "전체" },
  { id: "job", label: "채용" },
  { id: "support", label: "지원" },
  { id: "education", label: "교육" },
  { id: "hobby", label: "취미" },
];

interface Props {
  category: string;
  appliedOnly: boolean;
  onCategoryChange: (category: string) => void;
  onAppliedOnlyChange: (appliedOnly: boolean) => void;
}

export function CalendarFilterBar({
  category,
  appliedOnly,
  onCategoryChange,
  onAppliedOnlyChange,
}: Props) {
  return (
    <div className="px-5 py-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onCategoryChange(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              category === f.id ? "bg-primary text-white" : "bg-white text-[#4b5563]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <label className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold text-[#4b5563]">
        <span>신청완료만 보기</span>
        <ToggleSwitch checked={appliedOnly} onChange={onAppliedOnlyChange} aria-label="신청완료만 보기" />
      </label>
    </div>
  );
}

export function CalendarScheduleHeader({ month }: { month: Date }) {
  return (
    <h3 className="px-5 pb-2 text-lg font-bold text-[#1c1c27]">
      {month.getMonth() + 1}월 일정
    </h3>
  );
}
