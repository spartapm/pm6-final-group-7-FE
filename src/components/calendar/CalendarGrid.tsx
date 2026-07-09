"use client";

import { format, isSameMonth, isToday } from "date-fns";
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
}

export function CalendarGrid({
  month,
  items,
  selectedDate,
  onSelectDate,
  category,
  appliedOnly,
}: Props) {
  const days = getMonthGridDays(month);
  const dots = buildMonthDots(items, month, { category, appliedOnly });

  function handleDayClick(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    onSelectDate(selectedDate === key ? null : key);
  }

  return (
    <div className="mx-5 rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-semibold text-[#9aa0a8]">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const selected = selectedDate === key;
          const dayDots = dots.get(key) ?? [];

          return (
            <button
              key={key}
              type="button"
              onClick={() => inMonth && handleDayClick(day)}
              disabled={!inMonth}
              className={`flex min-h-[52px] flex-col items-center rounded-xl py-1.5 ${
                !inMonth ? "opacity-30" : selected ? "bg-primary/10" : "hover:bg-gray-50"
              }`}
              aria-label={format(day, "M월 d일")}
              aria-pressed={selected}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  today
                    ? "bg-primary text-white"
                    : inMonth
                      ? "text-[#1c1c27]"
                      : "text-[#c7c7d1]"
                } ${selected && !today ? "ring-2 ring-primary/40" : ""}`}
              >
                {format(day, "d")}
              </span>
              <span className="mt-0.5 flex h-2 items-center justify-center gap-0.5">
                {dayDots.slice(0, 3).map((cat) => (
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

export function CalendarLegend() {
  return (
    <div className="mx-5 mt-3 flex flex-wrap items-center gap-4 px-1 text-xs text-[#6b7280]">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-primary" />
        오늘
      </span>
      <span className="flex items-center gap-1.5">
        <span className="flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
        </span>
        신청 마감일
      </span>
    </div>
  );
}
