"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiFetch } from "@/lib/api-client";
import { ASSETS } from "@/lib/assets";
import { isAuthenticated, markGuestOnboardingComplete, syncGuestOnboarding } from "@/lib/guest-onboarding";
import { clearOnboardingFlow } from "@/lib/onboarding";

/** SCR-011 온보딩 완료 — 와이어프레임 시안 기준 */
export default function OnboardingCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!(await isAuthenticated())) {
        markGuestOnboardingComplete();
        setGuest(true);
        setLoading(false);
        return;
      }
      try {
        await syncGuestOnboarding();
        await apiFetch("/me/onboarding/complete", { method: "POST" });
      } catch {
        setError("온보딩 완료 처리에 실패했어요. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleStart() {
    if (loading) return;
    if (guest) {
      router.push("/login?next=/home");
      return;
    }
    if (error) {
      setLoading(true);
      setError(null);
      try {
        await apiFetch("/me/onboarding/complete", { method: "POST" });
      } catch {
        setError("온보딩 완료 처리에 실패했어요. 백엔드 서버를 확인해주세요.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    clearOnboardingFlow();
    router.push("/home");
  }

  function handleBrowseHome() {
    clearOnboardingFlow();
    router.push("/home");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex flex-1 flex-col items-center px-6 pb-8 pt-[120px] text-center">
        <div className="flex h-[152px] w-[152px] items-center justify-center overflow-hidden rounded-[26px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <Image
            src={ASSETS.logoComplete}
            alt="오육이랑"
            width={152}
            height={152}
            className="object-cover"
            priority
          />
        </div>

        <h1 className="mt-10 text-[27px] font-extrabold leading-tight text-[#101828]">
          이제 준비가 끝났어요!
        </h1>

        <p className="mt-3 text-[16px] leading-relaxed text-[#8a8f9c]">
          오육이랑이 회원님께 맞는
          <br />
          일자리·교육·활동을 찾아드릴게요.
        </p>

        <span className="mt-5 inline-flex max-w-full rounded-full bg-[#eef0fb] px-4 py-2.5 text-[14px] font-bold leading-snug text-[#4558b5]">
          개인정보 설정은 마이페이지에서 수정 가능해요
        </span>

        {loading && (
          <p className="mt-6 text-sm font-semibold text-primary">맞춤 추천을 생성하고 있어요...</p>
        )}
        {error && (
          <p className="mt-6 text-sm font-semibold text-[#f8736f]">{error}</p>
        )}
      </div>

      <div className="mx-auto w-full max-w-[390px] space-y-3 px-6 pb-10">
        <button
          type="button"
          disabled={loading}
          onClick={handleStart}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-4 text-[18px] font-bold text-white disabled:opacity-50"
        >
          {loading ? "준비 중..." : guest ? "로그인하고 시작하기" : "시작하기"}
          {!loading && <span aria-hidden>→</span>}
        </button>
        {guest && !loading && (
          <button
            type="button"
            onClick={handleBrowseHome}
            className="w-full py-2 text-[15px] font-bold text-primary"
          >
            홈에서 먼저 둘러보기
          </button>
        )}
      </div>
    </div>
  );
}
