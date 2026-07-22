export const SEOUL_DISTRICTS = [
  "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
  "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
  "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
];

// 하위 호환 — 확장 지역은 @/lib/regions 사용
export { SUPPORTED_CITIES, getDistrictsForCity, getAllSupportedDistricts } from "@/lib/regions";

export const AGE_BANDS = ["50세 미만", "50~54세", "55~59세", "60~64세", "65~69세", "70~74세", "75~79세", "80세 이상"];
export const CAREER_YEARS = ["1년 미만", "1~5년", "5~10년", "10~20년", "20년 이상"];
export const EDUCATION_LEVELS = ["중졸 이하", "고졸", "대졸 이상"];

export const CAREER_JOBS = [
  { code: "management_finance_office_insurance", label: "경영/금융/사무/보험" },
  { code: "public_teacher", label: "공무원(교사)" },
  { code: "education_research_law", label: "교육/강사/연구/법률" },
  { code: "medical_health_welfare", label: "의료/보건/사회복지" },
  { code: "marketing_trade", label: "마케팅/무역" },
  { code: "professional", label: "전문직(의사/변호사 등)" },
  { code: "culture_media_design", label: "문화·예술/신문방송/디자인" },
  { code: "sales_cs", label: "영업·판매/고객상담/CS" },
  { code: "construction_environment_industry", label: "건설·건축/환경/산업" },
  { code: "it_web", label: "IT/정보통신/웹" },
  { code: "hospitality_travel_sports_security_cleaning", label: "숙박·음식/여행/스포츠/경비청소" },
  { code: "homemaker", label: "전업주부·가사" },
  { code: "no_experience", label: "경력 없음" },
];

export const HOBBY_OPTIONS = [
  "운동·건강",
  "문화·예술 관람",
  "여행·나들이",
  "공예·만들기",
  "음악·악기",
  "댄스·노래",
  "동호회·친목 모임",
  "봉사활동",
];

export const LEARNING_OPTIONS = [
  "재취업·이직",
  "컴퓨터 활용",
  "자격증 취득",
  "AI·디지털",
  "외국어",
  "요양·복지",
  "노후 설계·재무",
  "생활·취미 클래스",
];

export type ImportantFollowUp =
  | { kind: "chips"; question: string; options: string[]; key: string; columns?: 2 | 3 | 4 }
  | { kind: "time_day"; key: string };

export interface ImportantTypeConfig {
  question: string;
  items: string[];
  followUps: Record<string, ImportantFollowUp>;
}

export const IMPORTANT_CONFIG: Record<string, ImportantTypeConfig> = {
  job: {
    question: "일자리를 볼 때 가장 중요하게 확인하는 정보는 무엇인가요?",
    items: ["급여", "근무 일수", "4대보험", "근무 형태"],
    followUps: {
      급여: {
        kind: "chips",
        question: "희망하는 급여 수준은 어떻게 되나요?",
        options: ["월 150만원 이하", "월 150~200만원", "월 200~250만원", "월 250만원 이상"],
        key: "salary_level",
        columns: 2,
      },
      "근무 일수": {
        kind: "chips",
        question: "희망하는 근무일수는 어떻게 되나요?",
        options: ["주 1~2일", "주 3~4일", "주 5일"],
        key: "work_days",
        columns: 3,
      },
      "4대보험": {
        kind: "chips",
        question: "4대보험 가입 여부를 선택해주세요.",
        options: ["제공", "미제공"],
        key: "insurance",
        columns: 2,
      },
      "근무 형태": {
        kind: "chips",
        question: "희망하는 고용형태는 무엇인가요?",
        options: ["정규직", "계약직(기간제)", "시간제(파트타임)", "일용직·단기"],
        key: "employment_type",
        columns: 2,
      },
    },
  },
  hobby: {
    question: "취미 활동을 볼 때 가장 중요하게 확인하는 하는 정보는 무엇인가요?",
    items: ["비용", "수강 방식", "활동 요일 및 시간대", "모집 인원"],
    followUps: {
      비용: {
        kind: "chips",
        question: "희망하는 비용은 어떻게 되나요?",
        options: ["무료", "유료"],
        key: "cost_type",
        columns: 2,
      },
      "수강 방식": {
        kind: "chips",
        question: "원하는 참여 방식은 무엇인가요?",
        options: ["오프라인", "온라인"],
        key: "participation_type",
        columns: 2,
      },
      "활동 요일 및 시간대": { kind: "time_day", key: "schedule" },
      "모집 인원": {
        kind: "chips",
        question: "원하는 모집 인원 규모는 어떻게 되나요?",
        options: ["1:1", "소규모(~10명)", "중규모(10~30명)", "대규모(30명 이상)"],
        key: "group_size",
        columns: 2,
      },
    },
  },
  learning: {
    question: "교육을 볼 때 가장 중요하게 확인하는 정보는 무엇인가요?",
    items: ["비용", "수강 방식", "교육 시간대", "모집 인원"],
    followUps: {
      비용: {
        kind: "chips",
        question: "희망하는 비용은 어떻게 되나요?",
        options: ["무료", "유료"],
        key: "cost_type",
        columns: 2,
      },
      "수강 방식": {
        kind: "chips",
        question: "원하는 수강 방식은 무엇인가요?",
        options: ["오프라인", "온라인"],
        key: "class_type",
        columns: 2,
      },
      "교육 시간대": { kind: "time_day", key: "schedule" },
      "모집 인원": {
        kind: "chips",
        question: "원하는 모집 인원 규모는 어떻게 되나요?",
        options: ["1:1", "소규모(~10명)", "중규모(10~30명)", "대규모(30명 이상)"],
        key: "group_size",
        columns: 2,
      },
    },
  },
};

export function getCareerJobLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return CAREER_JOBS.find((j) => j.code === code)?.label ?? null;
}

export function getDetailBackHref(type: string, directions: string[]): string {
  if (type === "job") return "/onboarding/interests";
  const ordered = getOrderedDirections(directions);
  const idx = ordered.indexOf(type as InterestDirection);
  if (idx <= 0) return "/onboarding/interests";
  const prev = ordered[idx - 1];
  return `/onboarding/important/${prev}`;
}

export function getImportantBackHref(type: string, directions: string[]): string {
  return `/onboarding/detail/${type}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  job: "채용",
  support: "지원",
  education: "교육",
  hobby: "취미",
};

export const ONBOARDING_TOTAL_STEPS = 9;

export const INTEREST_ORDER = ["job", "hobby", "learning"] as const;
export type InterestDirection = (typeof INTEREST_ORDER)[number];

export function getOrderedDirections(directions: string[]): InterestDirection[] {
  return INTEREST_ORDER.filter((d) => directions.includes(d));
}

export function getDetailStepKey(type: string): string {
  if (type === "job") return "detail_job";
  if (type === "hobby") return "detail_hobby";
  return "detail_learning";
}

export function getImportantStepKey(type: string): string {
  if (type === "job") return "important_job";
  if (type === "hobby") return "important_hobby";
  return "important_learning";
}

/** SCR-002~010 기준 단계 번호 (1~9). complete(SCR-011) 제외 */
export function getOnboardingStepNumber(
  step: string,
  directions: string[] = INTEREST_ORDER as unknown as string[]
): number {
  const ordered = getOrderedDirections(directions.length ? directions : [...INTEREST_ORDER]);
  if (step === "region") return 1;
  if (step === "region_district") return 1;
  if (step === "profile") return 2;
  if (step === "interests") return 3;
  for (let i = 0; i < ordered.length; i++) {
    const type = ordered[i];
    const detailNum = 4 + i * 2;
    if (step === getDetailStepKey(type)) return detailNum;
    if (step === getImportantStepKey(type)) return detailNum + 1;
  }
  return 1;
}

export function getDetailStepNumber(type: string, directions: string[]): number {
  return getOnboardingStepNumber(getDetailStepKey(type), directions);
}

export function getImportantStepNumber(type: string, directions: string[]): number {
  return getOnboardingStepNumber(getImportantStepKey(type), directions);
}

export function getNextAfterImportant(
  type: string,
  directions: string[]
): { step: string; path: string } | "complete" {
  const ordered = getOrderedDirections(directions);
  const idx = ordered.indexOf(type as InterestDirection);
  const next = ordered[idx + 1];
  if (!next) return "complete";
  return { step: getDetailStepKey(next), path: `/onboarding/detail/${next}` };
}

export function getOnboardingPath(step: string): string {
  const map: Record<string, string> = {
    region: "/onboarding/region",
    region_district: "/onboarding/region/district",
    profile: "/onboarding/profile",
    interests: "/onboarding/interests",
    detail_job: "/onboarding/detail/job",
    detail_hobby: "/onboarding/detail/hobby",
    detail_learning: "/onboarding/detail/learning",
    important_job: "/onboarding/important/job",
    important_hobby: "/onboarding/important/hobby",
    important_learning: "/onboarding/important/learning",
    complete: "/onboarding/complete",
  };
  return map[step] ?? "/onboarding/region";
}

export const ONBOARDING_FLOW_KEY = "onboarding_flow";

export type OnboardingFlow = "initial" | "settings";

export function setOnboardingFlow(flow: OnboardingFlow) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ONBOARDING_FLOW_KEY, flow);
}

export function getOnboardingFlow(): OnboardingFlow {
  if (typeof window === "undefined") return "initial";
  return sessionStorage.getItem(ONBOARDING_FLOW_KEY) === "settings" ? "settings" : "initial";
}

export function clearOnboardingFlow() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
  // 진행률 래칫도 함께 초기화 (재진입 시 새로 시작)
  sessionStorage.removeItem("obMaxPct");
}

export function getOnboardingCompletePath(): string {
  return getOnboardingFlow() === "settings" ? "/my/settings/complete" : "/onboarding/complete";
}
