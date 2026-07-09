"use client";

export { OnboardingNextButton } from "@/components/onboarding/OnboardingUI";

export function RegionNoticeBanner() {
  return (
    <div className="mt-6 rounded-xl border border-[#f0e0b0] bg-[#fff8e8] px-4 py-3">
      <p className="text-sm leading-relaxed text-[#a9822e]">
        📍 현재는 서울특별시 지역만 지원하고 있어요.
        <br />
        다른 지역은 순차적으로 지원될 예정입니다.
      </p>
    </div>
  );
}
