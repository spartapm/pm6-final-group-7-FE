"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import { OnboardingCheckboxCard, OnboardingNextButton } from "@/components/onboarding/OnboardingUI";
import { apiFetch } from "@/lib/api-client";
import {
  CAREER_JOBS,
  HOBBY_OPTIONS,
  LEARNING_OPTIONS,
  getCareerJobLabel,
  getDetailBackHref,
  getImportantStepKey,
} from "@/lib/onboarding";
import type { MeResponse } from "@/lib/types";

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

/** SCR-005~007 상세 선택 (Figma 1040:649 / 885 / 1280) */
export default function OnboardingDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  const meta = META[type] ?? META.job;
  const directions = me?.onboarding?.interest_directions ?? [];
  const prevCareerLabel = getCareerJobLabel(me?.onboarding?.career_job_code);

  const options =
    type === "job"
      ? CAREER_JOBS.map((j) => j.label)
      : type === "hobby"
        ? HOBBY_OPTIONS
        : LEARNING_OPTIONS;

  const prefKey =
    type === "job" ? "job_preferences" : type === "hobby" ? "hobby_preferences" : "learning_preferences";

  function toggle(v: string) {
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }

  async function handleNext() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await apiFetch("/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          [prefKey]: { interests: selected },
          onboarding_step: getImportantStepKey(type),
        }),
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
        {options.map((o) => (
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
