import { regionDistrictOptionsForCity, type FilterDefinition } from "@/lib/jobs-filters";
import type { Activity } from "@/lib/types";
import { matchesApplyStatus } from "@/lib/jobs-filters";
import { isAdultOrientedActivity } from "@/lib/adultTargetFilter";
import {
  educationFieldMatches,
  hobbyFieldMatches,
} from "@/lib/learning-field-aliases";
import { districtMatchesFilter } from "@/lib/regions";

/** 그룹별 다중 선택 배열 (list=체크 다중, chips=라디오 단일 0~1개) */
export type LearningFilterValues = Record<string, string[]>;

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

function withRegion(defs: FilterDefinition[], cityCode: string): FilterDefinition[] {
  const options = regionDistrictOptionsForCity(cityCode);
  return defs.map((d) => (d.id === "region" ? { ...d, options } : d));
}

const EDUCATION_TAB_FILTERS_BASE: FilterDefinition[] = [
  {
    id: "field",
    label: "분야",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      { value: "디지털·AI", label: "디지털·AI" },
      { value: "직업역량", label: "직업역량" },
      { value: "자격증", label: "자격증" },
      { value: "요리·생활", label: "요리·생활" },
      { value: "건강·복지", label: "건강·복지" },
      { value: "미디어", label: "미디어" },
      { value: "언어", label: "언어" },
    ],
  },
  {
    id: "region",
    label: "지역",
    layout: "list",
    options: [],
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

const HOBBY_TAB_FILTERS_BASE: FilterDefinition[] = [
  {
    id: "field",
    label: "분야",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      { value: "미술·공예", label: "미술·공예" },
      { value: "운동·건강", label: "운동·건강" },
      { value: "음악·공연", label: "음악·공연" },
      { value: "여행", label: "여행" },
      { value: "봉사·나눔", label: "봉사·나눔" },
      { value: "사진·영상", label: "사진·영상" },
      { value: "기타", label: "기타" },
    ],
  },
  {
    id: "region",
    label: "지역",
    layout: "list",
    options: [],
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

export const EDUCATION_TAB_FILTERS = withRegion(EDUCATION_TAB_FILTERS_BASE, "서울특별시");
export const HOBBY_TAB_FILTERS = withRegion(HOBBY_TAB_FILTERS_BASE, "서울특별시");

export function getEducationTabFilters(cityCode: string): FilterDefinition[] {
  return withRegion(EDUCATION_TAB_FILTERS_BASE, cityCode);
}

export function getHobbyTabFilters(cityCode: string): FilterDefinition[] {
  return withRegion(HOBBY_TAB_FILTERS_BASE, cityCode);
}

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

function matchLearningField(activity: Activity, value: string, tab: "education" | "hobby"): boolean {
  const primary = attr(activity, "field") || attr(activity, "field_primary");
  const secondary = attr(activity, "field_secondary");
  const tags = activity.attributes?.tags;
  const tagList = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
  const candidates = [primary, secondary, ...tagList];

  if (tab === "hobby") {
    if (hobbyFieldMatches(value, primary, secondary, ...tagList)) return true;
    // 분야 비어 있으면 제목 키워드 폴백
    if (!primary && !secondary && tagList.length === 0) {
      return activity.title.includes(value) || (activity.ai_summary?.includes(value) ?? false);
    }
    return false;
  }

  // education
  if (educationFieldMatches(value, ...candidates)) return true;
  if (!primary && !secondary && tagList.length === 0) {
    // work24 등 field 미적재: 제목으로 칩 키워드 매칭
    const hay = `${activity.title} ${activity.ai_summary ?? ""}`;
    if (value === "디지털·AI") return /AI|디지털|IT|컴퓨터|소프트웨어|데이터/i.test(hay);
    if (value === "자격증") return /자격|기능사|산업기사/.test(hay);
    if (value === "건강·복지") return /요양|복지|간호|보건|돌봄/.test(hay);
    if (value === "언어") return /영어|일본어|중국어|외국어|한국어/.test(hay);
    if (value === "요리·생활") return /요리|조리|제빵|바리스타|생활/.test(hay);
    if (value === "미디어") return /영상|미디어|콘텐츠|방송/.test(hay);
    if (value === "직업역량") return hay.trim().length > 0;
    return false;
  }
  return false;
}

/** 그룹 내 OR: 선택 값 중 하나라도 만족하면 통과. 미선택이면 통과. */
function groupMatch(selected: string[] | undefined, matcher: (value: string) => boolean): boolean {
  if (!selected || selected.length === 0) return true;
  return selected.some((v) => matcher(v));
}

function matchClassType(activity: Activity, value: string): boolean {
  const raw = attr(activity, "class_type") || attr(activity, "edcMthType");
  if (!raw) return true;
  const normalized = /온\s*라인|사이버|원격|비대면|e-?\s*러닝|이러닝/i.test(raw)
    ? "온라인"
    : /오프\s*라인|대면|집체|현장|혼합|블렌/i.test(raw)
      ? "오프라인"
      : raw;
  return normalized === value;
}

export function filterLearningActivities(
  items: Activity[],
  filters: LearningFilterValues,
  tab: "education" | "hobby" = "education",
  regionCity?: string | null
): Activity[] {
  return items.filter((activity) => {
    if (!isAdultOrientedActivity(activity)) return false;

    if (!groupMatch(filters.field, (v) => matchLearningField(activity, v, tab))) return false;

    if (
      !groupMatch(filters.region, (v) =>
        districtMatchesFilter(activity.region_district, v, regionCity)
      )
    )
      return false;

    if (!groupMatch(filters.classType, (v) => matchClassType(activity, v))) return false;

    if (!groupMatch(filters.cost, (v) => matchCost(activity, v))) return false;

    if (!groupMatch(filters.recruitStatus, (v) => matchesApplyStatus(activity, v))) return false;

    return true;
  });
}
