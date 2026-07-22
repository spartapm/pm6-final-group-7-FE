"use client";

import { format, isSameMonth, isToday, getDay } from "date-fns";
import {
  buildMonthDots,
  CATEGORY_DOT_COLORS,
  getMonthGridDays,
  type CalendarItem,
} from "@/lib/calendar-utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  month: Date;
  items: CalendarItem[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  category?: string;
  appliedOnly?: boolean;
  /** 시안: 접힘 시 약 2주만 표시 */
  collapsed?: boolean;
}

export function CalendarGrid({
  month,
  items,
  selectedDate,
  onSelectDate,
  category,
  appliedOnly,
  collapsed = false,
}: Props) {
  const days = getMonthGridDays(month);
  const visibleDays = collapsed ? days.slice(0, 14) : days;
  const dots = buildMonthDots(items, month, { category, appliedOnly });

  function handleDayClick(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    onSelectDate(selectedDate === key ? null : key);
  }

  return (
    <div className="mx-5 rounded-2xl bg-white px-3 pb-2 pt-3 shadow-sm">
      {/* 시안: 범례는 캘린더 카드 안 우측 상단 */}
      <div className="mb-2 flex items-center justify-end gap-3 px-1 text-[11px] text-[#6b7280]">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1c1c27]" />
          오늘
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#c5c9d4]" />
          신청 마감일
        </span>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-1 text-center text-xs font-semibold ${
              i === 0 ? "text-[#e85d5d]" : i === 6 ? "text-[#5b7fd6]" : "text-[#9aa0a8]"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {visibleDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const selected = selectedDate === key;
          const dayDots = dots.get(key) ?? [];
          const dow = getDay(day);

          return (
            <button
              key={key}
              type="button"
              onClick={() => inMonth && handleDayClick(day)}
              disabled={!inMonth}
              className={`flex min-h-[48px] flex-col items-center rounded-xl py-1 ${
                !inMonth ? "opacity-30" : ""
              }`}
              aria-label={format(day, "M월 d일")}
              aria-pressed={selected}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  today
                    ? "bg-[#1c1c27] text-white"
                    : selected
                      ? "bg-primary text-white"
                      : !inMonth
                        ? "text-[#c7c7d1]"
                        : dow === 0
                          ? "text-[#e85d5d]"
                          : dow === 6
                            ? "text-[#5b7fd6]"
                            : "text-[#1c1c27]"
                }`}
              >
                {format(day, "d")}
              </span>
              <span className="mt-0.5 flex min-h-2 w-5 flex-wrap items-center justify-center gap-0.5">
                {dayDots.slice(0, 4).map((cat) => (
                  <span
                    key={cat}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_DOT_COLORS[cat] }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
