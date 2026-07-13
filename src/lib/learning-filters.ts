import { SEOUL_DISTRICTS } from "@/lib/onboarding";
import type { Activity } from "@/lib/types";
import { matchesApplyStatus } from "@/lib/jobs-filters";
import type { FilterDefinition } from "@/lib/jobs-filters";

/** 그룹별 다중 선택 배열 (list=체크 다중, chips=라디오 단일 0~1개) */
export type LearningFilterValues = Record<string, string[]>;

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

// FL-03: 분야 값은 ingestion 분류기(LifelongField) 출력과 일치시켜 실제 매칭 보장
export const EDUCATION_TAB_FILTERS: FilterDefinition[] = [
  {
    id: "field",
    label: "분야",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      { value: "디지털·AI", label: "디지털·AI" },
      { value: "직업·자격", label: "직업·자격" },
      { value: "언어·문해", label: "언어·문해" },
      { value: "생활·교양", label: "생활·교양" },
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
      { value: "운동·건강", label: "운동·건강" },
      { value: "미술·공예", label: "미술·공예" },
      { value: "음악·공연", label: "음악·공연" },
      { value: "여행·나들이", label: "여행·나들이" },
      { value: "봉사·나눔", label: "봉사·나눔" },
      { value: "사진·영상", label: "사진·영상" },
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

/** 그룹 내 OR: 선택 값 중 하나라도 만족하면 통과. 미선택이면 통과. */
function groupMatch(selected: string[] | undefined, matcher: (value: string) => boolean): boolean {
  if (!selected || selected.length === 0) return true;
  return selected.some((v) => matcher(v));
}

export function filterLearningActivities(
  items: Activity[],
  filters: LearningFilterValues
): Activity[] {
  return items.filter((activity) => {
    if (!groupMatch(filters.field, (v) => matchLearningField(activity, v))) return false;

    if (!groupMatch(filters.region, (v) => activity.region_district === v)) return false;

    if (
      !groupMatch(filters.classType, (v) => {
        const ct = attr(activity, "class_type");
        return !ct || ct === v;
      })
    )
      return false;

    if (!groupMatch(filters.cost, (v) => matchCost(activity, v))) return false;

    if (!groupMatch(filters.recruitStatus, (v) => matchesApplyStatus(activity, v))) return false;

    return true;
  });
}
