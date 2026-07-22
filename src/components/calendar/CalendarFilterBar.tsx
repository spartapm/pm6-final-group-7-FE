"use client";

import { useEffect, useRef } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { CATEGORY_DOT_COLORS } from "@/lib/calendar-utils";

const FILTERS: Array<{ id: string; label: string; color?: string }> = [
  { id: "all", label: "전체" },
  { id: "job", label: "채용", color: CATEGORY_DOT_COLORS.job },
  { id: "support", label: "지원", color: CATEGORY_DOT_COLORS.support },
  { id: "education", label: "교육", color: CATEGORY_DOT_COLORS.education },
  { id: "hobby", label: "취미", color: CATEGORY_DOT_COLORS.hobby },
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
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const btn = buttonRefs.current.get(category);
    const scroller = scrollerRef.current;
    if (!btn || !scroller) return;

    const pad = 8;
    const scrollerRect = scroller.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    if (btnRect.left < scrollerRect.left + pad) {
      const delta = btnRect.left - scrollerRect.left - pad;
      scroller.scrollTo({
        left: Math.max(scroller.scrollLeft + delta, 0),
        behavior: "smooth",
      });
    } else if (btnRect.right > scrollerRect.right - pad) {
      const delta = btnRect.right - scrollerRect.right + pad;
      scroller.scrollTo({
        left: scroller.scrollLeft + delta,
        behavior: "smooth",
      });
    }
  }, [category]);

  return (
    <div className="px-5 py-3">
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {FILTERS.map((f) => {
          const active = category === f.id;
          return (
            <button
              key={f.id}
              type="button"
              ref={(el) => {
                if (el) buttonRefs.current.set(f.id, el);
                else buttonRefs.current.delete(f.id);
              }}
              onClick={() => onCategoryChange(f.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
                active
                  ? "bg-primary text-white"
                  : "border border-[#e6e8ef] bg-white text-[#4b5563]"
              }`}
            >
              {f.color && !active && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: f.color }}
                  aria-hidden
                />
              )}
              {f.label}
            </button>
          );
        })}
      </div>
      <label className="mt-2.5 flex items-center justify-end gap-2 text-sm font-semibold text-[#4b5563]">
        <span>신청완료만</span>
        <ToggleSwitch checked={appliedOnly} onChange={onAppliedOnlyChange} aria-label="신청완료만" />
      </label>
    </div>
  );
}

/** 연간 스크롤 리스트의 월 섹션 스티키 헤더 — 시안: 연보라 배경 */
export function CalendarScheduleHeader({ monthNumber }: { monthNumber: number }) {
  return (
    <h3 className="sticky top-0 z-10 bg-[#edeffb] px-5 py-2.5 text-[17px] font-bold text-[#1c1c27]">
      {monthNumber}월 일정
    </h3>
  );
}
