"use client";

import {
  formatCareerSummary,
  formatDemographics,
  formatRegion,
  getInterestLabels,
} from "@/lib/my-profile-display";
import type { MeResponse } from "@/lib/types";

interface MyProfileCardProps {
  me: MeResponse | undefined;
  onPersonalize: () => void;
}

export function MyProfileCard({ me, onPersonalize }: MyProfileCardProps) {
  const nickname = me?.profile?.nickname ?? "회원";
  const demographics = formatDemographics(me?.onboarding?.gender, me?.onboarding?.age_band);
  const region = formatRegion(me?.onboarding?.region_district);
  const career = formatCareerSummary(me?.onboarding?.career_job_code, me?.onboarding?.career_years);
  const interests = getInterestLabels(me);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(91,109,191,0.12)]">
      <div className="flex gap-4">
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-[#eef0f8] text-3xl text-[#9ca0ac]">
          👤
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[20px] font-bold text-[#1c1c27]">{nickname}님</p>
          <p className="mt-1 text-[15px] text-[#9096a6]">{demographics}</p>
          {region && (
            <p className="mt-1 flex items-center gap-1 text-[15px] text-[#9096a6]">
              <span aria-hidden>📍</span>
              {region}
            </p>
          )}
        </div>
      </div>

      {career && <p className="mt-3 text-[15px] font-medium text-[#1c1c27]">{career}</p>}

      {interests.length > 0 && (
        <div className="mt-4 rounded-2xl bg-[#f3f0ff] px-5 py-4">
          <p className="text-[14px] font-bold text-[#7b61ff]">관심 방향</p>
          <ul className="mt-2 space-y-1.5">
            {interests.map((label) => (
              <li key={label} className="text-[15px] font-bold text-[#565dbc]">
                · {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onPersonalize}
        className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-[16px] font-bold text-white"
      >
        개인화 설정 변경하기
      </button>
    </div>
  );
}
