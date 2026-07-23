"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { syncGuestOnboarding } from "@/lib/guest-onboarding";
import { getOnboardingPath } from "@/lib/onboarding";
import { safeNextPath, savePostOnboardingNext } from "@/lib/auth-redirect";
import type { MeResponse } from "@/lib/types";

/**
 * 로그인 성공 후 공통 착지 처리.
 * - 게스트 온보딩 답변을 서버에 동기화
 * - 온보딩 완료 여부에 따라 next 로 이동하거나 온보딩 경로로 유도
 * - 온보딩으로 보낼 때는 next 를 저장해 완료 후 복귀 (8-A)
 */
function AuthContinueInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const next = safeNextPath(searchParams.get("next"));
      try {
        // 게스트로 진행한 온보딩 답변을 서버에 반영 (완료된 상태였다면 서버에서도 완료 처리됨)
        await syncGuestOnboarding();
        const me = await apiFetch<MeResponse>("/me");
        if (me.onboarding?.onboarding_completed_at) {
          router.replace(next);
          return;
        }
        // 온보딩 경로로 복귀 요청이 있으면 존중
        if (next.startsWith("/onboarding")) {
          router.replace(next);
          return;
        }
        savePostOnboardingNext(next);
        router.replace(getOnboardingPath(me.onboarding?.onboarding_step ?? "region"));
      } catch {
        router.replace(next);
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white">
      <p className="text-sm font-semibold text-text-muted">로그인 처리 중...</p>
    </div>
  );
}

export default function AuthContinuePage() {
  return (
    <Suspense fallback={null}>
      <AuthContinueInner />
    </Suspense>
  );
}
