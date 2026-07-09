"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OnboardingNextButton } from "@/components/onboarding/OnboardingUI";
import { apiFetch } from "@/lib/api-client";
import { ASSETS } from "@/lib/assets";
import { clearOnboardingFlow } from "@/lib/onboarding";

/** SCR-011 온보딩 완료 (Figma 1040:1321) */
export default function OnboardingCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/me/onboarding/complete", { method: "POST" })
      .catch(() => setError("온보딩 완료 처리에 실패했어요. 다시 시도해주세요."))
      .finally(() => setLoading(false));
  }, []);

  async function handleStart() {
    if (loading) return;
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

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pb-28 pt-[182px] text-center">
      <div className="flex h-[152px] w-[152px] items-center justify-center overflow-hidden rounded-[26px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
        <Image src={ASSETS.logoComplete} alt="오육이랑" width={152} height={152} className="object-cover" priority />
      </div>

      <h1 className="mt-10 text-[27px] font-extrabold text-[#101828]">이제 준비가 끝났어요!</h1>
      <p className="mt-3 text-base text-[#8a8f9c]">
        오육이랑이 회원님께 맞는
        <br />
        일자리·교육·활동을 찾아드릴게요.
      </p>

      {loading && (
        <p className="mt-6 text-sm font-semibold text-primary">맞춤 추천을 생성하고 있어요...</p>
      )}
      {error && (
        <p className="mt-6 text-sm font-semibold text-[#f8736f]">{error}</p>
      )}

      <div className="mt-auto w-full pt-10">
        <OnboardingNextButton
          label="시작하기"
          disabled={loading}
          loading={loading}
          onClick={handleStart}
        />
      </div>
    </div>
  );
}
