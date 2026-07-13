"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import { OnboardingNextButton, RegionNoticeBanner } from "@/components/onboarding/OnboardingRegionUI";
import { apiFetch } from "@/lib/api-client";
import { SEOUL_DISTRICTS } from "@/lib/onboarding";
import type { MeResponse } from "@/lib/types";

/** SCR-002 구 선택 (Figma 1039:307) — 서울 선택 후 */
export default function OnboardingDistrictPage() {
  const router = useRouter();
  const [district, setDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    if (me?.onboarding?.region_district) setDistrict(me.onboarding.region_district);
  }, [me]);

  async function handleNext() {
    if (!district) return;
    setLoading(true);
    try {
      await apiFetch("/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          region_city: "서울특별시",
          region_district: district,
          onboarding_step: "profile",
        }),
      });
      router.push("/onboarding/profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-28 pt-6">
      <OnboardingStepProgress step="region_district" backHref="/onboarding/region" />

      <h1 className="text-2xl font-bold text-text-primary">어느 지역에 계세요?</h1>
      <p className="mt-2 text-base text-[#9a9da8]">가까운 활동과 일자리를 찾아드려요</p>

      <Link
        href="/onboarding/region"
        className="mt-4 inline-block text-base font-semibold text-primary-accent underline"
      >
        ‹ 서울 다시 선택
      </Link>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {SEOUL_DISTRICTS.map((d) => {
          const selected = district === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDistrict(d)}
              className={`rounded-2xl border py-3.5 text-lg ${
                selected
                  ? "border-primary bg-primary font-bold text-white"
                  : "border-gray-200 bg-white font-semibold text-[#212c3d]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <RegionNoticeBanner />

      <OnboardingNextButton
        disabled={!district}
        loading={loading}
        onClick={handleNext}
      />
    </div>
  );
}
