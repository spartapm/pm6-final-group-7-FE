import type { Activity, ActivityCategory, UserOnboarding } from "./types";

export const AI_SUMMARY_LABELS: Record<ActivityCategory, string> = {
  job: "AI 공고 요약",
  support: "AI 지원사업 설명",
  education: "AI 교육 설명",
  hobby: "AI 활동 요약",
};

const EMPTY_SUMMARY = "요약 정보가 아직 없어요.";

export function isStaleAiSummary(summary: string | null | undefined): boolean {
  const s = summary?.trim();
  if (!s) return true;
  if (s.startsWith("-")) return true;
  if ((s.match(/\s-\s/g) ?? []).length >= 2) return true;
  if (s.length > 85 && s.split(/[.!?。]/).filter(Boolean).length < 2) return true;
  if ((s.match(/[,，]/g) ?? []).length >= 1) return true;
  if (/\d{1,2}:\d{2}/.test(s)) return true;
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
    if (typeof info.salary === "string" && info.salary) parts.push(info.salary);
    if (typeof attrs.salary === "string" && attrs.salary) parts.push(String(attrs.salary));
    if (typeof attrs.work_type === "string" && attrs.work_type) parts.push(String(attrs.work_type));
  }

  if (activity.category === "education" || activity.category === "hobby") {
    const info =
      activity.category === "education"
        ? onboarding.important_learning_info
        : onboarding.important_hobby_info;
    if (typeof info?.cost === "string" && info.cost) parts.push(info.cost);
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
