"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import {
  OnboardingChip,
  OnboardingNextButton,
  OnboardingSectionLabel,
} from "@/components/onboarding/OnboardingUI";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { saveOnboardingPatch } from "@/lib/guest-onboarding";
import { AGE_BANDS, CAREER_JOBS, CAREER_YEARS, EDUCATION_LEVELS } from "@/lib/onboarding";

/** SCR-003 기본 정보 (Figma 1:4583) */
export default function OnboardingProfilePage() {
  const router = useRouter();
  const [ageBand, setAgeBand] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [careerJob, setCareerJob] = useState<string | null>(null);
  const [careerYears, setCareerYears] = useState<string | null>(null);
  const [education, setEducation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onboarding = useOnboardingData();

  useEffect(() => {
    if (!onboarding) return;
    setAgeBand(onboarding.age_band ?? null);
    setGender(onboarding.gender ?? null);
    setCareerJob(onboarding.career_job_code ?? null);
    setCareerYears(onboarding.career_years ?? null);
    setEducation(onboarding.education ?? null);
  }, [onboarding]);

  const careerYearsOptional = careerJob === "homemaker" || careerJob === "no_experience";
  const valid = ageBand && gender && careerJob && (careerYearsOptional || careerYears);

  async function handleNext() {
    if (!valid) return;
    setLoading(true);
    try {
      await saveOnboardingPatch({
        age_band: ageBand,
        gender,
        career_job_code: careerJob,
        career_years: careerYears,
        education,
        onboarding_step: "interests",
      });
      router.push("/onboarding/interests");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-28 pt-6">
      <OnboardingStepProgress step="profile" backHref="/onboarding/region/district" />

      <h1 className="text-2xl font-bold text-[#101828]">조금 더 알려주세요</h1>
      <p className="mt-2 text-base text-[#9a9da8]">더 잘 맞는 내용을 찾아드릴게요</p>

      <div className="mt-8 space-y-6">
        <section>
          <OnboardingSectionLabel title="나이대" required />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {AGE_BANDS.map((o) => (
              <OnboardingChip key={o} label={o} selected={ageBand === o} onClick={() => setAgeBand(o)} />
            ))}
          </div>
        </section>

        <section>
          <OnboardingSectionLabel title="성별" required />
          <div className="mt-3 flex flex-wrap gap-2">
            {["남성", "여성"].map((o) => (
              <OnboardingChip
                key={o}
                label={o}
                selected={gender === o}
                onClick={() => setGender(o)}
                className="min-w-[100px]"
              />
            ))}
          </div>
        </section>

        <section>
          <OnboardingSectionLabel title="주요 경력 직종" required />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CAREER_JOBS.map((j) => (
              <OnboardingChip
                key={j.code}
                label={j.label}
                selected={careerJob === j.code}
                onClick={() => setCareerJob(j.code)}
              />
            ))}
          </div>
        </section>

        <section>
          <OnboardingSectionLabel title="경력 기간" required={careerYearsOptional ? "optional" : true} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {CAREER_YEARS.map((o) => (
              <OnboardingChip key={o} label={o} selected={careerYears === o} onClick={() => setCareerYears(o)} />
            ))}
          </div>
        </section>

        <section>
          <OnboardingSectionLabel title="최종 학력을 선택해주세요" required="optional" />
          <div className="mt-3 flex flex-wrap gap-2">
            {EDUCATION_LEVELS.map((o) => (
              <OnboardingChip
                key={o}
                label={o}
                selected={education === o}
                onClick={() => setEducation(o)}
                className="min-w-[90px]"
              />
            ))}
          </div>
        </section>
      </div>

      <OnboardingNextButton disabled={!valid} loading={loading} onClick={handleNext} />
    </div>
  );
}
