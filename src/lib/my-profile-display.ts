import { CAREER_JOBS, getOrderedDirections } from "@/lib/onboarding";
import type { MeResponse } from "@/lib/types";

export const INTEREST_DIRECTION_LABELS: Record<string, string> = {
  job: "다시 일하고 싶어요 (재취업·소득활동)",
  hobby: "즐길 활동을 찾고 싶어요 (취미·여가·봉사)",
  learning: "무언가를 배우고 싶어요 (배움·자기계발)",
};

export function getCareerJobLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return CAREER_JOBS.find((j) => j.code === code)?.label ?? null;
}

export function formatDemographics(gender: string | null | undefined, ageBand: string | null | undefined): string {
  const parts = [gender, ageBand].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "정보 없음";
}

export function formatRegion(district: string | null | undefined): string | null {
  if (!district) return null;
  return `서울 ${district}`;
}

export function formatCareerSummary(
  careerJobCode: string | null | undefined,
  careerYears: string | null | undefined
): string | null {
  const job = getCareerJobLabel(careerJobCode);
  if (!job && !careerYears) return null;
  if (job && careerYears) return `${job} · 경력 ${careerYears}`;
  return job ?? `경력 ${careerYears}`;
}

export function getInterestLabels(me: MeResponse | undefined): string[] {
  const directions = me?.onboarding?.interest_directions ?? [];
  return getOrderedDirections(directions).map((d) => INTEREST_DIRECTION_LABELS[d] ?? d);
}
