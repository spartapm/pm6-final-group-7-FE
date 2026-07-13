import type { Activity, ActivityCategory, UserOnboarding } from "./types";

export const AI_SUMMARY_LABELS: Record<ActivityCategory, string> = {
  job: "AI 공고 요약",
  support: "AI 지원사업 설명",
  education: "AI 교육 설명",
  hobby: "AI 활동 요약",
};

const EMPTY_SUMMARY = "요약 정보가 아직 없어요.";

// S-02: 정상 문장에 흔한 쉼표/시각만으로 stale 판정하던 로직을 완화(매번 재생성 방지).
// 원천 데이터를 그대로 붙여넣은 요약(불릿/키-값 나열 등)만 stale로 간주한다.
export function isStaleAiSummary(summary: string | null | undefined): boolean {
  const s = summary?.trim();
  if (!s) return true;
  if (s.startsWith("-")) return true;
  if ((s.match(/\s-\s/g) ?? []).length >= 2) return true;
  if (s.length > 120 && s.split(/[.!?。]/).filter(Boolean).length < 2) return true;
  if (/\/\s*\d|시급\s*\//.test(s)) return true;
  return false;
}

function extractRawDescription(raw: Record<string, unknown>): string {
  const candidates = [
    raw.description,
    raw.detail,
    raw.edcSbject,
    raw.supportContent,
    raw.servicePurpose,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

export function truncateForCard(text: string, maxLen = 80): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) return normalized;
  // 마침표 단위로 끊어 두 줄 느낌 유지
  const parts = normalized.split(/(?<=[.!?。])\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const two = parts.slice(0, 2).join(" ");
    if (two.length <= maxLen) return two;
  }
  return `${normalized.slice(0, maxLen - 1)}…`;
}

export function getAiSummaryLabel(category: ActivityCategory | string): string {
  return AI_SUMMARY_LABELS[category as ActivityCategory] ?? "AI 요약";
}

export function resolveCardSummary(activity: Activity): string {
  if (activity.ai_summary?.trim()) return truncateForCard(activity.ai_summary);
  const raw = extractRawDescription(activity.raw_content);
  if (raw) return truncateForCard(raw);
  return EMPTY_SUMMARY;
}

export function resolveDetailSummary(activity: Activity): string {
  if (activity.ai_summary?.trim()) return activity.ai_summary.trim();
  const raw = extractRawDescription(activity.raw_content);
  if (raw) return raw;
  return EMPTY_SUMMARY;
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
    // 온보딩 급여 응답은 salary_level 키로 저장됨 (HM-D)
    if (typeof info.salary_level === "string" && info.salary_level) parts.push(String(info.salary_level));
    if (typeof attrs.salary === "string" && attrs.salary) parts.push(String(attrs.salary));
    if (typeof attrs.work_type === "string" && attrs.work_type) parts.push(String(attrs.work_type));
  }

  if (activity.category === "education" || activity.category === "hobby") {
    const info =
      activity.category === "education"
        ? onboarding.important_learning_info
        : onboarding.important_hobby_info;
    // 온보딩 비용 응답은 cost_type 키로 저장됨 (HM-D)
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
  return truncateForCard(`${lead}${body}`);
}
