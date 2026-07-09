"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiFetch } from "@/lib/api-client";
import { ASSETS } from "@/lib/assets";
import { clearOnboardingFlow } from "@/lib/onboarding";

/** SCR-019 개인화 설정 변경 완료 (Figma 1212:249) */
export default function SettingsCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/me/onboarding/complete", { method: "POST" })
      .catch(() => setError("설정 반영에 실패했어요. 다시 시도해주세요."))
      .finally(() => setLoading(false));
  }, []);

  async function handleReturn() {
    if (loading) return;

    if (error) {
      setLoading(true);
      setError(null);
      try {
        await apiFetch("/me/onboarding/complete", { method: "POST" });
      } catch {
        setError("설정 반영에 실패했어요. 백엔드 서버를 확인해주세요.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    clearOnboardingFlow();
    router.push("/my");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="h-1.5 shrink-0 gradient-header" />

      <div className="flex flex-1 flex-col items-center px-6 pb-10 pt-[140px] text-center">
        <div className="flex h-[153px] w-[153px] items-center justify-center overflow-hidden rounded-[26px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <Image
            src={ASSETS.logoComplete}
            alt="오육이랑"
            width={153}
            height={153}
            className="object-cover"
            priority
          />
        </div>

        <h1 className="mt-10 text-[26px] font-bold text-[#191a23]">설정 완료!</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[#9096a6]">
          변경된 설정을 바탕으로
          <br />
          맞춤 정보를 새로 준비할게요.
        </p>

        {loading && (
          <p className="mt-6 text-sm font-semibold text-primary">맞춤 정보를 준비하고 있어요...</p>
        )}
        {error && <p className="mt-6 text-sm font-semibold text-[#f8736f]">{error}</p>}

        <div className="mt-auto w-full pt-16">
          <button
            type="button"
            disabled={loading}
            onClick={handleReturn}
            className="w-full rounded-2xl bg-primary py-4 text-[18px] font-bold text-white disabled:opacity-50"
          >
            {loading ? "준비 중..." : "마이페이지로 돌아가기"}
          </button>
        </div>
      </div>
    </div>
  );
}
