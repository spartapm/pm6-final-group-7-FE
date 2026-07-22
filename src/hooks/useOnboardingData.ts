"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import {
  getGuestOnboarding,
  isAuthenticated,
  syncGuestOnboarding,
} from "@/lib/guest-onboarding";
import type { MeResponse, UserOnboarding } from "@/lib/types";

/**
 * 온보딩 답변 조회 — 로그인 시 서버(/me), 비로그인 시 로컬(게스트) 데이터.
 * 로그인 상태에서 게스트 데이터가 남아 있으면 먼저 서버로 동기화한다(카카오 OAuth 복귀 포함).
 */
export function useOnboardingData() {
  const { data } = useQuery({
    queryKey: ["onboarding-data"],
    queryFn: async (): Promise<Partial<UserOnboarding> | null> => {
      if (await isAuthenticated()) {
        await syncGuestOnboarding();
        const me = await apiFetch<MeResponse>("/me");
        return me.onboarding;
      }
      return getGuestOnboarding();
    },
  });
  return data ?? null;
}
