import { CAREER_JOBS } from "@/lib/onboarding";
import { districtMatchesFilter, getDistrictsForCity } from "@/lib/regions";
import { normalizeWorkDays } from "@/lib/workDaysNormalize";
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

/** 거주 시·도의 구·군만 (전국·전체 옵션 없음) */
export function regionDistrictOptionsForCity(cityCode: string): FilterOption[] {
  return getDistrictsForCity(cityCode || "서울특별시").map((d) => ({ value: d, label: d }));
}

function withRegionOptions(defs: FilterDefinition[], cityCode: string): FilterDefinition[] {
  const options = regionDistrictOptionsForCity(cityCode);
  return defs.map((d) => (d.id === "region" ? { ...d, options } : d));
}

const JOB_TAB_FILTERS_BASE: FilterDefinition[] = [
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
    options: [],
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

const SUPPORT_TAB_FILTERS_BASE: FilterDefinition[] = [
  {
    id: "field",
    label: "분야",
    layout: "list",
    options: [
      { value: "", label: "전체" },
      { value: "경제", label: "경제" },
      { value: "주택", label: "주택" },
      { value: "교통", label: "교통" },
      { value: "복지", label: "복지" },
      { value: "문화", label: "문화" },
      { value: "환경", label: "환경" },
      { value: "안전", label: "안전" },
      { value: "행정", label: "행정" },
    ],
  },
  {
    id: "region",
    label: "지역",
    layout: "list",
    options: [],
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

/** @deprecated 정적 — getJobTabFilters(city) 사용 */
export const JOB_TAB_FILTERS = withRegionOptions(JOB_TAB_FILTERS_BASE, "서울특별시");
/** @deprecated 정적 — getSupportTabFilters(city) 사용 */
export const SUPPORT_TAB_FILTERS = withRegionOptions(SUPPORT_TAB_FILTERS_BASE, "서울특별시");

export function getJobTabFilters(cityCode: string): FilterDefinition[] {
  return withRegionOptions(JOB_TAB_FILTERS_BASE, cityCode);
}

export function getSupportTabFilters(cityCode: string): FilterDefinition[] {
  return withRegionOptions(SUPPORT_TAB_FILTERS_BASE, cityCode);
}

/** 필터 값: 그룹별 다중 선택 배열. list = 체크(다중), chips = 라디오(단일, 0~1개) */
export type JobsFilterValues = Record<string, string[]>;

export function createEmptyFilters(definitions: FilterDefinition[]): JobsFilterValues {
  return Object.fromEntries(definitions.map((d) => [d.id, [] as string[]]));
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

/** FL-02: '모집중' 선택 시 상시접수 공고도 포함 */
export function matchesApplyStatus(activity: Activity, selected: string): boolean {
  const status = getApplyStatus(activity);
  if (selected === "모집중") return status === "모집중" || status === "상시접수";
  return status === selected;
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

function matchIndustry(activity: Activity, value: string): boolean {
  const job = CAREER_JOBS.find((j) => j.label === value);
  const code = job?.code;
  const tags = activity.attributes?.onboarding_job_tags;
  if (Array.isArray(tags) && tags.length > 0) {
    if (code && tags.includes(code)) return true;
    if (tags.includes(value)) return true;
    return false;
  }
  // 목업/필터_업종 필드
  const filterIndustry = attr(activity, "filter_industry") || attr(activity, "industry") || attr(activity, "job_category");
  if (filterIndustry) {
    if (filterIndustry === value) return true;
    // 라벨 변형: 경영·금융·사무·보험 ↔ 경영/금융/사무/보험
    const norm = (s: string) => s.replace(/[·/]/g, "");
    if (norm(filterIndustry) === norm(value)) return true;
    if (job && norm(filterIndustry).includes(norm(job.label.replace(/\//g, "·")))) return true;
  }
  // 태그 없고 업종도 없으면 필터 미적용(통과하지 않음 — 업종 선택 시 관련 공고만)
  if (!filterIndustry) return false;
  return false;
}

/** 그룹 내 OR: 선택된 값 중 하나라도 matcher를 만족하면 통과. 미선택(빈 배열)이면 통과. */
function groupMatch(selected: string[] | undefined, matcher: (value: string) => boolean): boolean {
  if (!selected || selected.length === 0) return true;
  return selected.some((v) => matcher(v));
}

export function filterActivities(
  items: Activity[],
  category: "job" | "support",
  filters: JobsFilterValues,
  regionCity?: string | null
): Activity[] {
  return items.filter((activity) => {
    if (category === "job") {
      if (!groupMatch(filters.industry, (v) => matchIndustry(activity, v))) return false;

      // 지역: 경기 시는 하위 구 공고도 매칭
      if (
        !groupMatch(filters.region, (v) =>
          districtMatchesFilter(activity.region_district, v, regionCity)
        )
      )
        return false;

      if (!groupMatch(filters.workType, (v) => matchWorkType(activity, v))) return false;

      if (
        !groupMatch(filters.career, (v) => {
          const req = attr(activity, "career_requirement");
          return !req || req === v;
        })
      )
        return false;

      if (
        !groupMatch(filters.workDays, (v) => {
          const chip =
            attr(activity, "work_days_normalized") ||
            attr(activity, "work_days_chip") ||
            normalizeWorkDays(attr(activity, "work_days")) ||
            "";
          const wd = attr(activity, "work_days");
          if (!chip && !wd) return true;
          return chip === v || wd === v || wd.includes(v.replace("주 ", ""));
        })
      )
        return false;

      if (
        !groupMatch(filters.salary, (v) => {
          const sal = attr(activity, "salary");
          return !sal || sal.includes(v.replace("월 ", ""));
        })
      )
        return false;

      if (
        !groupMatch(filters.insurance, (v) => {
          const ins = attr(activity, "insurance");
          return !ins || ins === v;
        })
      )
        return false;

      return true;
    }

    // support
    if (!groupMatch(filters.field, (v) => matchField(activity, v))) return false;

    // 지역: 전국(region_district null) 지원사업은 어떤 구를 선택해도 노출 (FL-05 정책)
    if (
      !groupMatch(
        filters.region,
        (v) =>
          !activity.region_district ||
          districtMatchesFilter(activity.region_district, v, regionCity)
      )
    )
      return false;

    if (!groupMatch(filters.applyStatus, (v) => matchesApplyStatus(activity, v))) return false;

    return true;
  });
}
