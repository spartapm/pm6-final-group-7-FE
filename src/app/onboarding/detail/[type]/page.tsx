"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import { OnboardingCheckboxCard, OnboardingNextButton } from "@/components/onboarding/OnboardingUI";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { saveOnboardingPatch } from "@/lib/guest-onboarding";
import {
  CAREER_JOBS,
  HOBBY_OPTIONS,
  LEARNING_OPTIONS,
  getCareerJobLabel,
  getDetailBackHref,
  getImportantStepKey,
} from "@/lib/onboarding";

const META: Record<string, { title: string; subtitle: string }> = {
  job: {
    title: "어떤 일을 하고 싶으세요?",
    subtitle: "관심 있는 분야를 모두 선택해주세요",
  },
  hobby: {
    title: "어떤 활동을 즐기고 싶으세요?",
    subtitle: "관심 있는 활동을 모두 선택해주세요",
  },
  learning: {
    title: "어떤 걸 배우고 싶으세요?",
    subtitle: "관심 있는 교육을 모두 선택해주세요",
  },
};

/** SCR-005~007 상세 선택 (Figma 1:4693 / 1:4895 / 1:5250) */
export default function OnboardingDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const onboarding = useOnboardingData();

  const meta = META[type] ?? META.job;
  const directions = onboarding?.interest_directions ?? [];
  const prevCareerLabel = getCareerJobLabel(onboarding?.career_job_code);

  const options =
    type === "job"
      ? CAREER_JOBS.filter((j) => j.code !== "no_experience").map((j) => j.label)
      : type === "hobby"
        ? HOBBY_OPTIONS
        : LEARNING_OPTIONS;

  // ON-03: 이전 경력 항목을 옵션 최상단으로 정렬
  const orderedOptions =
    type === "job" && prevCareerLabel && options.includes(prevCareerLabel)
      ? [prevCareerLabel, ...options.filter((o) => o !== prevCareerLabel)]
      : options;

  const prefKey =
    type === "job" ? "job_preferences" : type === "hobby" ? "hobby_preferences" : "learning_preferences";

  useEffect(() => {
    const prefs = onboarding?.[prefKey] as { interests?: string[] } | undefined;
    if (prefs?.interests && prefs.interests.length > 0) setSelected(prefs.interests);
  }, [onboarding, prefKey]);

  function toggle(v: string) {
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }

  async function handleNext() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await saveOnboardingPatch({
        [prefKey]: { interests: selected },
        onboarding_step: getImportantStepKey(type),
      });
      router.push(`/onboarding/important/${type}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
      <OnboardingStepProgress detailType={type} backHref={getDetailBackHref(type, directions)} />

      <h1 className="text-2xl font-bold text-[#101828]">{meta.title}</h1>
      <p className="mt-2 text-base text-[#9a9da8]">{meta.subtitle}</p>

      <div className="mt-6 space-y-2">
        {orderedOptions.map((o) => (
          <OnboardingCheckboxCard
            key={o}
            label={o}
            checked={selected.includes(o)}
            onToggle={() => toggle(o)}
            badge={type === "job" && o === prevCareerLabel ? "이전 경력" : undefined}
          />
        ))}
      </div>

      <OnboardingNextButton
        disabled={selected.length === 0}
        loading={loading}
        onClick={handleNext}
      />
    </div>
  );
}
