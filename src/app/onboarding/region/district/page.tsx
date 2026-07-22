"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import { OnboardingNextButton, RegionNoticeBanner } from "@/components/onboarding/OnboardingRegionUI";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { saveOnboardingPatch } from "@/lib/guest-onboarding";
import { getDistrictsForCity, getCityByCode } from "@/lib/regions";

/** SCR-002 구·시 선택 */
export default function OnboardingDistrictPage() {
  const router = useRouter();
  const [district, setDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onboarding = useOnboardingData();

  const cityCode = onboarding?.region_city || "서울특별시";
  const city = getCityByCode(cityCode);
  const districts = getDistrictsForCity(cityCode);
  const cityLabel = city?.label ?? "서울";

  useEffect(() => {
    if (onboarding?.region_district) setDistrict(onboarding.region_district);
  }, [onboarding]);

  async function handleNext() {
    if (!district) return;
    setLoading(true);
    try {
      await saveOnboardingPatch({
        region_city: cityCode,
        region_district: district,
        onboarding_step: "profile",
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
      <p className="mt-2 text-base text-[#9a9da8]">가까운 지역의 일자리와 활동을 추천해드려요.</p>

      <Link
        href="/onboarding/region"
        className="mt-4 inline-block text-base font-semibold text-primary-accent underline"
      >
        ‹ {cityLabel} 다시 선택
      </Link>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {districts.map((d) => {
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
