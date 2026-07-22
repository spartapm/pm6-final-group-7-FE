"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import { OnboardingNextButton, RegionNoticeBanner } from "@/components/onboarding/OnboardingRegionUI";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { saveOnboardingPatch } from "@/lib/guest-onboarding";
import { getOnboardingFlow } from "@/lib/onboarding";
import { isSupportedCityLabel, getCityByLabel, getCityByCode } from "@/lib/regions";

const ALL_CITY_LABELS = [
  "서울", "경기", "인천", "부산", "대구", "광주",
  "대전", "울산", "세종", "강원", "충북", "충남",
  "전북", "전남", "경북", "경남", "제주",
];

/** SCR-002 시·도 선택 — Figma 1:4453 */
export default function OnboardingCityPage() {
  const router = useRouter();
  const [city, setCity] = useState("서울");
  const [loading, setLoading] = useState(false);
  const [backHref, setBackHref] = useState<string | undefined>(undefined);
  const onboarding = useOnboardingData();

  useEffect(() => {
    if (getOnboardingFlow() === "settings") setBackHref("/my");
  }, []);

  useEffect(() => {
    const saved = onboarding?.region_city ? getCityByCode(onboarding.region_city) : null;
    if (saved) setCity(saved.label);
  }, [onboarding]);

  async function handleNext() {
    if (!isSupportedCityLabel(city)) return;
    const region = getCityByLabel(city);
    if (!region) return;
    setLoading(true);
    try {
      await saveOnboardingPatch({
        region_city: region.code,
        onboarding_step: "region_district",
      });
      router.push("/onboarding/region/district");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-28 pt-6">
      <OnboardingStepProgress step="region" backHref={backHref} />

      <h1 className="text-2xl font-bold text-text-primary">어느 지역에 계세요?</h1>
      <p className="mt-2 text-lg text-[#8a8f9c]">가까운 지역의 일자리와 활동을 추천해드려요.</p>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {ALL_CITY_LABELS.map((c) => {
          const enabled = isSupportedCityLabel(c);
          const selected = city === c;
          return (
            <button
              key={c}
              type="button"
              disabled={!enabled}
              onClick={() => enabled && setCity(c)}
              className={`rounded-2xl border py-4 text-lg ${
                selected
                  ? "border-primary bg-white font-bold text-text-primary shadow-sm"
                  : enabled
                    ? "border-gray-200 bg-white font-medium text-text-primary"
                    : "border-transparent bg-[#f3f4f6] font-medium text-[#cbcdd6]"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <RegionNoticeBanner />

      <OnboardingNextButton
        disabled={!isSupportedCityLabel(city)}
        loading={loading}
        onClick={handleNext}
      />
    </div>
  );
}
