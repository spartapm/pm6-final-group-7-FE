"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, devLogin } from "@/lib/api-client";
import { enableDevSession, useDevAuthSession } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getGuestOnboarding, syncGuestOnboarding } from "@/lib/guest-onboarding";
import { getOnboardingPath } from "@/lib/onboarding";
import { safeNextPath } from "@/lib/auth-redirect";
import { ASSETS } from "@/lib/assets";
import type { MeResponse } from "@/lib/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const devMode = useDevAuthSession();

  useEffect(() => {
    if (searchParams.get("error") === "rejoin_cooldown") {
      setErrorMessage("재가입은 7일 후 가능합니다.");
    }
  }, [searchParams]);

  async function afterLogin() {
    const requestedNext = safeNextPath(searchParams.get("next"));
    try {
      // 게스트로 진행한 온보딩 답변을 서버에 반영한 뒤 이동
      await syncGuestOnboarding();
      const me = await apiFetch<MeResponse>("/me");
      if (!me.onboarding?.onboarding_completed_at) {
        // 온보딩 경로로 복귀 요청이 있으면 존중
        if (requestedNext.startsWith("/onboarding")) {
          router.push(requestedNext);
          return;
        }
        router.push(getOnboardingPath(me.onboarding?.onboarding_step ?? "region"));
        return;
      }
    } catch {
      // fall through
    }
    router.push(requestedNext);
  }

  async function handleDevLogin() {
    setLoading(true);
    setErrorMessage(null);
    try {
      await devLogin();
      enableDevSession();
      await afterLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그인에 실패했어요.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleKakaoLogin() {
    if (devMode) {
      await handleDevLogin();
      return;
    }
    const supabase = createClient();
    // URL next 우선, 없으면 게스트 온보딩 단계로 복귀
    const fromQuery = searchParams.get("next");
    const guest = getGuestOnboarding();
    const fallbackNext = guest?.onboarding_step
      ? getOnboardingPath(guest.onboarding_step)
      : null;
    const nextPath = safeNextPath(fromQuery ?? fallbackNext, "/home");
    const next = `?next=${encodeURIComponent(nextPath)}`;
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback${next}` },
    });
  }

  return (
  <>
      {errorMessage && (
        <div className="mt-6 rounded-2xl bg-[#fff0f0] px-4 py-3 text-center text-[15px] font-bold text-[#e8434f]">
          {errorMessage}
        </div>
      )}

      <div className="relative mx-auto mt-8 w-full max-w-sm">
        <div className="rounded-2xl bg-[#eef0fc] px-4 py-3.5 text-center">
          <p className="text-[15px] font-bold text-[#4558b5]">
            ⚡ 간편 로그인으로 3초만에 시작하세요!
          </p>
        </div>
        <div className="mx-auto h-3 w-6 bg-[#eef0fc]" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleKakaoLogin}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-4 text-[17px] font-bold text-[#191919] disabled:opacity-60"
      >
        <span className="text-xl">💬</span>
        {loading ? "로그인 중..." : devMode ? "개발 로그인 (카카오 대체)" : "카카오톡으로 시작하기"}
      </button>

      {/* M-22: 이메일 로그인 진입 링크 */}
      <button
        type="button"
        onClick={() => {
          const next = searchParams.get("next");
          const q = next ? `?next=${encodeURIComponent(next)}` : "";
          router.push(`/login/email${q}`);
        }}
        className="mx-auto mt-4 block text-[15px] font-semibold text-text-muted underline underline-offset-4"
      >
        이메일로 로그인하기
      </button>

      <p className="mt-6 text-center text-[13px] text-text-muted">
        로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>
  </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="gradient-header flex flex-col items-center px-6 pb-16 pt-12">
        <div className="relative h-[100px] w-[100px] overflow-hidden rounded-[26px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <Image
            src={ASSETS.logoLogin}
            alt="오육이랑"
            fill
            className="object-cover"
            priority
          />
        </div>
        <h1 className="mt-4 text-[29px] font-extrabold text-white">오육이랑</h1>
        <p className="mt-1 text-[15px] text-[#e6e9fa]">5060 시니어를 위한 맞춤 플랫폼</p>
      </div>

      <div className="-mt-8 flex flex-1 flex-col rounded-t-[28px] bg-white px-7 pb-10 pt-10">
        <h2 className="text-center text-[28px] font-extrabold text-text-primary">오육이랑</h2>
        <p className="mt-2 text-center text-lg font-medium text-[#8a8f9c]">
          5060의 새로운 시작, 함께
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
