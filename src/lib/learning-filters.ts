import { SEOUL_DISTRICTS } from "@/lib/onboarding";
import type { Activity } from "@/lib/types";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { FilterDefinition } from "@/lib/jobs-filters";

export type LearningFilterValues = Record<string, string>;

const REGION_OPTIONS = [{ value: "", label: "전체" }, ...SEOUL_DISTRICTS.map((d) => ({ value: d, label: d }))];

const COST_CHIP_OPTIONS = [
  { value: "", label: "전체" },
  { value: "무료", label: "무료" },
  { value: "유료", label: "유료" },
];

const RECRUIT_CHIP_OPTIONS = [
  { value: "", label: "전체" },
  { value: "모집예정", label: "모집예정" },
  { value: "모집중", label: "모집중" },
  { value: "상시접수", label: "상시접수" },
];

export const EDUCATION_TAB_FILTERS: FilterDefinition[] = [
  {
    id: "field",
    label: "분야",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      { value: "디지털·AI", label: "디지털·AI" },
      { value: "직업역량", label: "직업역량" },
      { value: "자격증", label: "자격증" },
      { value: "노후설계", label: "노후설계" },
      { value: "생활교양", label: "생활교양" },
    ],
  },
  {
    id: "region",
    label: "지역",
    layout: "list",
    options: REGION_OPTIONS,
  },
  {
    id: "classType",
    label: "수강 방식",
    layout: "chips",
    options: [
      { value: "", label: "전체" },
      { value: "오프라인", label: "오프라인" },
      { value: "온라인", label: "온라인" },
    ],
  },
  {
    id: "cost",
    label: "비용",
    layout: "chips",
    options: COST_CHIP_OPTIONS,
  },
  {
    id: "recruitStatus",
    label: "모집 상태",
    layout: "chips",
    options: RECRUIT_CHIP_OPTIONS,
  },
];

export const HOBBY_TAB_FILTERS: FilterDefinition[] = [
  {
    id: "field",
    label: "분야",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      { value: "미술·공예", label: "미술·공예" },
      { value: "운동·건강", label: "운동·건강" },
      { value: "음악·공연", label: "음악·공연" },
      { value: "여행·나들이", label: "여행·나들이" },
      { value: "봉사나눔", label: "봉사나눔" },
      { value: "사진영상", label: "사진영상" },
    ],
  },
  {
    id: "region",
    label: "지역",
    layout: "list",
    options: REGION_OPTIONS,
  },
  {
    id: "cost",
    label: "비용",
    layout: "chips",
    options: COST_CHIP_OPTIONS,
  },
  {
    id: "recruitStatus",
    label: "모집",
    layout: "chips",
    options: RECRUIT_CHIP_OPTIONS,
  },
];

function attr(activity: Activity, key: string): string {
  const v = activity.attributes?.[key];
  return typeof v === "string" ? v : "";
}

function getRecruitStatus(activity: Activity): string {
  if (!activity.apply_end) return "상시접수";
  const start = activity.apply_start ? parseISO(activity.apply_start) : null;
  const end = parseISO(activity.apply_end);
  const today = new Date();
  if (start && differenceInCalendarDays(start, today) > 0) return "모집예정";
  if (differenceInCalendarDays(end, today) >= 0) return "모집중";
  return "마감";
}

function matchCost(activity: Activity, value: string): boolean {
  const cost = attr(activity, "cost");
  if (!cost) return true;
  if (value === "무료") return cost.includes("무료");
  if (value === "유료") return !cost.includes("무료");
  return true;
}

function matchLearningField(activity: Activity, value: string): boolean {
  const field = attr(activity, "field");
  if (field) return field === value;
  return activity.title.includes(value) || (activity.ai_summary?.includes(value) ?? false);
}

export function filterLearningActivities(
  items: Activity[],
  filters: LearningFilterValues
): Activity[] {
  return items.filter((activity) => {
    const field = filters.field ?? "";
    if (field && !matchLearningField(activity, field)) return false;

    const region = filters.region ?? "";
    if (region && activity.region_district !== region) return false;

    const classType = filters.classType ?? "";
    if (classType && attr(activity, "class_type") && attr(activity, "class_type") !== classType) {
      return false;
    }

    const cost = filters.cost ?? "";
    if (cost && !matchCost(activity, cost)) return false;

    const recruitStatus = filters.recruitStatus ?? "";
    if (recruitStatus && getRecruitStatus(activity) !== recruitStatus) return false;

    return true;
  });
}
