"use client";

import { addMonths, format, subMonths } from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  month: Date;
  onChange: (month: Date) => void;
}

export function CalendarMonthHeader({ month, onChange }: Props) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <button
        type="button"
        onClick={() => onChange(subMonths(month, 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-[#1c1c27]"
        aria-label="이전 달"
      >
        ‹
      </button>
      <h2 className="text-[20px] font-bold text-[#1c1c27]">
        {format(month, "yyyy년 M월", { locale: ko })}
      </h2>
      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-[#1c1c27]"
        aria-label="다음 달"
      >
        ›
      </button>
    </div>
  );
}
