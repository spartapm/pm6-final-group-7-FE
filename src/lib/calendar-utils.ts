import {
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay,
} from "date-fns";
import type { Activity, ActivityCategory } from "./types";

export interface CalendarItem {
  activity: Activity;
  bookmarked: boolean;
  applied: boolean;
}

export const CATEGORY_DOT_COLORS: Record<ActivityCategory, string> = {
  job: "#2563eb",
  support: "#16a34a",
  education: "#7c3aed",
  hobby: "#ea580c",
};

export const CATEGORY_TAG_STYLES: Record<
  ActivityCategory,
  { bg: string; text: string }
> = {
  job: { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
  support: { bg: "bg-[#dcfce7]", text: "text-[#15803d]" },
  education: { bg: "bg-[#ede9fe]", text: "text-[#6d28d9]" },
  hobby: { bg: "bg-[#fff7ed]", text: "text-[#c2410c]" },
};

export function getCalendarDate(activity: Activity): string | null {
  return activity.apply_end;
}

export function isActivityExpired(activity: Activity): boolean {
  return activity.status === "expired";
}

export function filterCalendarItems(
  items: CalendarItem[],
  options: {
    month: Date;
    selectedDate?: string | null;
    category?: string;
    appliedOnly?: boolean;
    /** 정책1: 상시접수(마감일 없음) 항목을 리스트에 포함. 캘린더 점 계산에는 사용하지 않음 */
    includeAlwaysOpen?: boolean;
  }
): CalendarItem[] {
  let filtered = items;

  if (options.appliedOnly) {
    filtered = filtered.filter((item) => item.applied);
  }

  if (options.category && options.category !== "all") {
    filtered = filtered.filter((item) => item.activity.category === options.category);
  }

  filtered = filtered.filter((item) => {
    const date = getCalendarDate(item.activity);
    if (!date) {
      // 정책1: 특정 날짜 선택이 아닐 때만 상시접수 항목을 리스트에 노출
      return Boolean(options.includeAlwaysOpen) && !options.selectedDate;
    }
    const d = parseISO(date);
    if (options.selectedDate) {
      return format(d, "yyyy-MM-dd") === options.selectedDate;
    }
    return isSameMonth(d, options.month);
  });

  return filtered.sort((a, b) =>
    (a.activity.apply_end ?? "").localeCompare(b.activity.apply_end ?? "")
  );
}

export function buildMonthDots(
  items: CalendarItem[],
  month: Date,
  options?: { category?: string; appliedOnly?: boolean }
): Map<string, ActivityCategory[]> {
  const dots = new Map<string, ActivityCategory[]>();
  const filtered = filterCalendarItems(items, {
    month,
    category: options?.category,
    appliedOnly: options?.appliedOnly,
  });

  for (const item of filtered) {
    const date = getCalendarDate(item.activity);
    if (!date) continue;
    const key = format(parseISO(date), "yyyy-MM-dd");
    const list = dots.get(key) ?? [];
    if (!list.includes(item.activity.category)) {
      list.push(item.activity.category);
    }
    dots.set(key, list);
  }

  return dots;
}

export function getMonthGridDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/**
 * 홈 "다가오는 내 일정": 신청완료(applied)한 항목만, 오늘부터 N일 이내, 최대 maxCount개.
 * (HM-B) 찜만 한 항목은 제외.
 */
export function getUpcomingAppliedItems(
  items: CalendarItem[],
  options?: { withinDays?: number; maxCount?: number }
): CalendarItem[] {
  const withinDays = options?.withinDays ?? 7;
  const maxCount = options?.maxCount ?? 3;
  const today = startOfDay(new Date());
  const limit = new Date(today);
  limit.setDate(limit.getDate() + withinDays);

  return items
    .filter((item) => item.applied)
    .map((item) => {
      const dateStr = getCalendarDate(item.activity);
      if (!dateStr) return null;
      return { item, date: parseISO(dateStr) };
    })
    .filter(Boolean)
    .filter((entry) => {
      const { date } = entry as { item: CalendarItem; date: Date };
      const notPast = !isBefore(date, today) || isSameDay(date, today);
      return notPast && !isBefore(limit, date);
    })
    .sort((a, b) => (a as { date: Date }).date.getTime() - (b as { date: Date }).date.getTime())
    .slice(0, maxCount)
    .map((entry) => (entry as { item: CalendarItem }).item);
}

export function getNearestUpcomingItem(items: CalendarItem[]): CalendarItem | null {
  const today = startOfDay(new Date());
  const withDates = items
    .map((item) => {
      const dateStr = getCalendarDate(item.activity);
      if (!dateStr) return null;
      return { item, date: parseISO(dateStr) };
    })
    .filter(Boolean) as Array<{ item: CalendarItem; date: Date }>;

  const upcoming = withDates
    .filter(({ date }) => !isBefore(date, today) || isSameDay(date, today))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming.length > 0) return upcoming[0].item;

  return withDates.sort((a, b) => a.date.getTime() - b.date.getTime())[0]?.item ?? null;
}

export function formatApplyPeriod(activity: Activity): string {
  const { apply_start, apply_end } = activity;
  if (apply_start && apply_end) {
    return `${format(parseISO(apply_start), "M월 d일")} ~ ${format(parseISO(apply_end), "M월 d일")}`;
  }
  if (apply_end) return `~ ${format(parseISO(apply_end), "M월 d일")}`;
  if (apply_start) return `${format(parseISO(apply_start), "M월 d일")} ~`;
  return "상시 접수";
}

export type CalendarEmptyReason =
  | "none"
  | "no_saved"
  | "no_date"
  | "no_filter"
  | "error";

export function getCalendarEmptyMessage(reason: CalendarEmptyReason): {
  title: string;
  description?: string;
} {
  switch (reason) {
    case "no_saved":
      return {
        title: "저장된 일정이 아직 없어요.",
        description: "찜하거나 신청한 활동이 여기에 표시됩니다.",
      };
    case "no_date":
      return { title: "해당 날짜에 일정이 없어요." };
    case "no_filter":
      return { title: "해당 조건의 일정이 없어요." };
    case "error":
      return {
        title: "일정을 불러오지 못했어요.",
        description: "다시 시도해주세요.",
      };
    default:
      return { title: "저장된 일정이 아직 없어요." };
  }
}
