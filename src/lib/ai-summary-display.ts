import type { Activity, ActivityCategory, UserOnboarding } from "./types";

export const AI_SUMMARY_LABELS: Record<ActivityCategory, string> = {
  job: "AI 공고 요약",
  support: "AI 지원사업 설명",
  education: "AI 교육 설명",
  hobby: "AI 활동 요약",
};

const EMPTY_MESSAGE = "요약 정보가 아직 없어요.";

const ONE_SENTENCE_CARD_SOURCES = new Set([
  "tour_api",
  "seoul_cultural_event",
  "seoul_fifty_plus",
]);

const HIDEABLE_SOURCES = new Set([
  "tour_api",
  "seoul_cultural_event",
  "seoul_fifty_plus",
]);

// S-02: 정상 문장에 흔한 쉼표/시각만으로 stale 판정하던 로직을 완화(매번 재생성 방지).
export function isStaleAiSummary(summary: string | null | undefined): boolean {
  // 의도적 빈 요약(숨김)은 stale이 아님
  if (summary === "") return false;
  const s = summary?.trim();
  if (!s) return true;
  if (s.startsWith("-")) return true;
  if ((s.match(/\s-\s/g) ?? []).length >= 2) return true;
  if (s.length > 120 && s.split(/[.!?。]/).filter(Boolean).length < 2) return true;
  if (/\/\s*\d|시급\s*\//.test(s)) return true;
  return false;
}

/** 요약 영역을 아예 숨길지 (정보 부족으로 생성 안 함) */
export function shouldHideAiSummary(activity: Activity, summary?: string | null): boolean {
  const source = activity.external_source ?? "";
  if (!HIDEABLE_SOURCES.has(source)) return false;
  const text = summary !== undefined ? summary : activity.ai_summary;
  if (text === "") return true;
  if (text == null) return false; // 아직 미생성 — 로딩/생성 허용
  return !text.trim();
}

function extractRawDescription(raw: Record<string, unknown>): string {
  const candidates = [
    raw.description,
    raw.detail,
    raw.edcSbject,
    raw.supportContent,
    raw.servicePurpose,
    raw.overview,
    raw.PROGRAM,
    raw.ETC_DESC,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

/** 첫 문장 우선 컷 (tour/문화/50+ 카드용) */
export function firstSentence(text: string, maxLen = 90): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const parts = normalized.split(/(?<=[.!?。])\s+/).filter(Boolean);
  const one = parts[0] ?? normalized;
  if (one.length <= maxLen) return one.endsWith(".") || one.endsWith("。") ? one : one;
  return `${one.slice(0, maxLen - 1)}…`;
}

export function truncateForCard(text: string, maxLen = 80): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) return normalized;
  const parts = normalized.split(/(?<=[.!?。])\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const two = parts.slice(0, 2).join(" ");
    if (two.length <= maxLen) return two;
    if ((parts[0]?.length ?? 0) <= maxLen) return parts[0]!;
  }
  return `${normalized.slice(0, maxLen - 1)}…`;
}

export function truncateCardSummary(activity: Activity, text: string): string {
  if (ONE_SENTENCE_CARD_SOURCES.has(activity.external_source ?? "")) {
    return firstSentence(text, 90);
  }
  return truncateForCard(text, activity.category === "job" ? 100 : 80);
}

export function getAiSummaryLabel(category: ActivityCategory | string): string {
  return AI_SUMMARY_LABELS[category as ActivityCategory] ?? "AI 요약";
}

export function resolveCardSummary(activity: Activity): string {
  if (activity.ai_summary === "") return "";
  if (activity.ai_summary?.trim()) return truncateCardSummary(activity, activity.ai_summary);
  if (HIDEABLE_SOURCES.has(activity.external_source ?? "")) return "";
  const raw = extractRawDescription(activity.raw_content ?? {});
  if (raw) return truncateCardSummary(activity, raw);
  return EMPTY_MESSAGE;
}

export function resolveDetailSummary(activity: Activity): string {
  if (activity.ai_summary === "") return "";
  if (activity.ai_summary?.trim()) return activity.ai_summary.trim();
  if (HIDEABLE_SOURCES.has(activity.external_source ?? "")) return "";
  const raw = extractRawDescription(activity.raw_content ?? {});
  if (raw) return raw;
  return EMPTY_MESSAGE;
}

export function buildSummaryLead(
  activity: Activity,
  onboarding?: UserOnboarding | null
): string {
  if (!onboarding) return "";

  const attrs = activity.attributes ?? {};
  const parts: string[] = [];

  if (activity.category === "job") {
    const info = onboarding.important_job_info ?? {};
    if (typeof info.salary_level === "string" && info.salary_level) parts.push(String(info.salary_level));
    if (typeof attrs.salary === "string" && attrs.salary) parts.push(String(attrs.salary));
    if (typeof attrs.work_type === "string" && attrs.work_type) parts.push(String(attrs.work_type));
  }

  if (activity.category === "education" || activity.category === "hobby") {
    const info =
      activity.category === "education"
        ? onboarding.important_learning_info
        : onboarding.important_hobby_info;
    if (typeof info?.cost_type === "string" && info.cost_type) parts.push(String(info.cost_type));
    if (typeof attrs.cost === "string" && attrs.cost) parts.push(String(attrs.cost));
  }

  if (activity.category === "support") {
    if (typeof attrs.benefit_amount === "string" && attrs.benefit_amount) {
      parts.push(String(attrs.benefit_amount));
    }
  }

  if (parts.length === 0) return "";
  return `${parts.slice(0, 2).join(" · ")} · `;
}

export function resolveCardSummaryWithLead(
  activity: Activity,
  onboarding?: UserOnboarding | null
): string {
  const lead = buildSummaryLead(activity, onboarding);
  const body = resolveCardSummary(activity);
  if (!body) return "";
  return truncateCardSummary(activity, `${lead}${body}`);
}
