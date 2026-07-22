"use client";

import { apiFetch } from "@/lib/api-client";
import { hasDevSession, useDevAuthSession } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { UserOnboarding } from "@/lib/types";

/**
 * 확정5(비로그인 둘러보기): 로그인 없이 온보딩을 진행할 수 있도록
 * 답변을 localStorage에 보관했다가 로그인 시 서버로 동기화한다.
 */
const GUEST_ONBOARDING_KEY = "oyukirang-guest-onboarding";

export type OnboardingPatch = Record<string, unknown>;

export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (useDevAuthSession()) return hasDevSession();
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export function getGuestOnboarding(): Partial<UserOnboarding> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_ONBOARDING_KEY);
    return raw ? (JSON.parse(raw) as Partial<UserOnboarding>) : null;
  } catch {
    return null;
  }
}

export function patchGuestOnboarding(patch: OnboardingPatch) {
  if (typeof window === "undefined") return;
  const current = getGuestOnboarding() ?? {};
  localStorage.setItem(GUEST_ONBOARDING_KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearGuestOnboarding() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_ONBOARDING_KEY);
}

/** 게스트 온보딩 완료 표시 — 홈에서 맞춤 추천·온보딩 CTA 분기용 */
export function markGuestOnboardingComplete() {
  patchGuestOnboarding({
    onboarding_step: "complete",
    onboarding_completed_at: new Date().toISOString(),
  });
}

export function isGuestOnboardingComplete(
  data: Partial<UserOnboarding> | null = typeof window !== "undefined" ? getGuestOnboarding() : null
): boolean {
  return Boolean(data?.onboarding_completed_at) || data?.onboarding_step === "complete";
}

/** 추천 엔진용 최소 UserOnboarding 형태로 정규화 */
export function normalizeGuestOnboarding(
  partial: Partial<UserOnboarding> | null
): UserOnboarding | null {
  if (!partial) return null;
  return {
    region_city: partial.region_city ?? "seoul",
    region_district: partial.region_district ?? null,
    age_band: partial.age_band ?? null,
    gender: partial.gender ?? null,
    career_job_code: partial.career_job_code ?? null,
    career_years: partial.career_years ?? null,
    education: partial.education ?? null,
    interest_directions: partial.interest_directions?.length
      ? partial.interest_directions
      : ["job", "hobby", "learning"],
    job_preferences: partial.job_preferences ?? {},
    hobby_preferences: partial.hobby_preferences ?? {},
    learning_preferences: partial.learning_preferences ?? {},
    important_job_info: partial.important_job_info ?? {},
    important_hobby_info: partial.important_hobby_info ?? {},
    important_learning_info: partial.important_learning_info ?? {},
    onboarding_step: partial.onboarding_step ?? "complete",
    onboarding_completed_at: partial.onboarding_completed_at ?? new Date().toISOString(),
  };
}

/** 로그인 상태면 서버에, 비로그인이면 로컬에 온보딩 답변 저장 */
export async function saveOnboardingPatch(patch: OnboardingPatch): Promise<{ guest: boolean }> {
  if (await isAuthenticated()) {
    await apiFetch("/me/onboarding", { method: "PATCH", body: JSON.stringify(patch) });
    return { guest: false };
  }
  patchGuestOnboarding(patch);
  return { guest: true };
}

/** 로그인 직후 호출: 게스트로 작성한 온보딩 답변을 서버에 반영하고 로컬에서 제거 */
export async function syncGuestOnboarding(): Promise<void> {
  const data = getGuestOnboarding();
  if (!data || Object.keys(data).length === 0) return;
  const wasComplete = isGuestOnboardingComplete(data);
  try {
    await apiFetch("/me/onboarding", { method: "PATCH", body: JSON.stringify(data) });
    if (wasComplete) {
      await apiFetch("/me/onboarding/complete", { method: "POST" });
    }
    clearGuestOnboarding();
  } catch {
    // 동기화 실패 시 로컬 데이터를 유지해 다음 로그인 때 재시도
  }
}
