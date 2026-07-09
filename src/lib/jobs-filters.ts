import { CAREER_JOBS, SEOUL_DISTRICTS } from "@/lib/onboarding";
import type { Activity } from "@/lib/types";
import { differenceInCalendarDays, parseISO } from "date-fns";

export type FilterLayout = "list" | "chips";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  layout: FilterLayout;
  options: FilterOption[];
}

export const JOB_TAB_FILTERS: FilterDefinition[] = [
  {
    id: "industry",
    label: "업종",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      ...CAREER_JOBS.map((j) => ({ value: j.label, label: j.label })),
    ],
  },
  {
    id: "region",
    label: "지역",
    layout: "list",
    options: [{ value: "", label: "전체" }, ...SEOUL_DISTRICTS.map((d) => ({ value: d, label: d }))],
  },
  {
    id: "workType",
    label: "근무형태",
    layout: "chips",
    options: [
      { value: "", label: "전체" },
      { value: "정규직", label: "정규직" },
      { value: "계약직(기간제)", label: "계약직(기간제)" },
      { value: "시간제(파트타임)", label: "시간제(파트타임)" },
      { value: "일용직·단기", label: "일용직·단기" },
    ],
  },
  {
    id: "career",
    label: "경력사항",
    layout: "chips",
    options: [
      { value: "", label: "전체" },
      { value: "경력 무관", label: "경력 무관" },
      { value: "신입 가능", label: "신입 가능" },
      { value: "경력 우대", label: "경력 우대" },
    ],
  },
  {
    id: "workDays",
    label: "근무 일수",
    layout: "chips",
    options: [
      { value: "", label: "전체" },
      { value: "주 1~2일", label: "주 1~2일" },
      { value: "주 3~4일", label: "주 3~4일" },
      { value: "주 5일", label: "주 5일" },
    ],
  },
  {
    id: "salary",
    label: "급여",
    layout: "chips",
    options: [
      { value: "", label: "전체" },
      { value: "월 150만원 이하", label: "월 150만원 이하" },
      { value: "월 150~200만원", label: "월 150~200만원" },
      { value: "월 200~250만원", label: "월 200~250만원" },
      { value: "월 250만원 이상", label: "월 250만원 이상" },
    ],
  },
  {
    id: "insurance",
    label: "4대보험",
    layout: "chips",
    options: [
      { value: "", label: "전체" },
      { value: "제공", label: "제공" },
      { value: "미제공", label: "미제공" },
    ],
  },
];

export const SUPPORT_TAB_FILTERS: FilterDefinition[] = [
  {
    id: "field",
    label: "분야",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      { value: "노후", label: "노후" },
      { value: "주택", label: "주택" },
      { value: "경제", label: "경제" },
      { value: "교통", label: "교통" },
    ],
  },
  {
    id: "region",
    label: "지역",
    layout: "list",
    options: [{ value: "", label: "전체" }, ...SEOUL_DISTRICTS.map((d) => ({ value: d, label: d }))],
  },
  {
    id: "applyStatus",
    label: "신청 상태",
    layout: "chips",
    options: [
      { value: "", label: "전체" },
      { value: "모집예정", label: "모집예정" },
      { value: "모집중", label: "모집중" },
      { value: "상시접수", label: "상시접수" },
    ],
  },
];

export type JobsFilterValues = Record<string, string>;

export function createEmptyFilters(definitions: FilterDefinition[]): JobsFilterValues {
  return Object.fromEntries(definitions.map((d) => [d.id, ""]));
}

function attr(activity: Activity, key: string): string {
  const v = activity.attributes?.[key];
  return typeof v === "string" ? v : "";
}

function getApplyStatus(activity: Activity): string {
  if (!activity.apply_end) return "상시접수";
  const start = activity.apply_start ? parseISO(activity.apply_start) : null;
  const end = parseISO(activity.apply_end);
  const today = new Date();
  if (start && differenceInCalendarDays(start, today) > 0) return "모집예정";
  if (differenceInCalendarDays(end, today) >= 0) return "모집중";
  return "마감";
}

function matchWorkType(activity: Activity, value: string): boolean {
  const raw = attr(activity, "employment_type");
  if (!raw) return true;
  if (value === "계약직(기간제)") return raw.includes("계약");
  if (value === "시간제(파트타임)") return raw.includes("시간");
  if (value === "일용직·단기") return raw.includes("일용") || raw.includes("단기");
  return raw.includes(value);
}

function matchField(activity: Activity, value: string): boolean {
  const field = attr(activity, "support_field");
  if (field) return field === value;
  return activity.title.includes(value) || (activity.ai_summary?.includes(value) ?? false);
}

export function filterActivities(
  items: Activity[],
  category: "job" | "support",
  filters: JobsFilterValues
): Activity[] {
  return items.filter((activity) => {
    if (category === "job") {
      const industry = filters.industry ?? "";
      if (industry) {
        const label = attr(activity, "industry") || attr(activity, "job_category");
        if (label && label !== industry) return false;
      }

      const region = filters.region ?? "";
      if (region && activity.region_district !== region) return false;

      const workType = filters.workType ?? "";
      if (workType && !matchWorkType(activity, workType)) return false;

      const career = filters.career ?? "";
      if (career && attr(activity, "career_requirement") && attr(activity, "career_requirement") !== career) {
        return false;
      }

      const workDays = filters.workDays ?? "";
      if (workDays && attr(activity, "work_days") && attr(activity, "work_days") !== workDays) return false;

      const salary = filters.salary ?? "";
      if (salary && attr(activity, "salary") && !attr(activity, "salary").includes(salary.replace("월 ", ""))) {
        return false;
      }

      const insurance = filters.insurance ?? "";
      if (insurance && attr(activity, "insurance") && attr(activity, "insurance") !== insurance) return false;

      return true;
    }

    const field = filters.field ?? "";
    if (field && !matchField(activity, field)) return false;

    const region = filters.region ?? "";
    if (region && activity.region_district && activity.region_district !== region) return false;

    const applyStatus = filters.applyStatus ?? "";
    if (applyStatus && getApplyStatus(activity) !== applyStatus) return false;

    return true;
  });
}
