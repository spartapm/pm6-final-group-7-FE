"use client";

import { useQuery } from "@tanstack/react-query";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";
import { apiFetch } from "@/lib/api-client";
import {
  ONBOARDING_TOTAL_STEPS,
  getDetailStepNumber,
  getImportantStepNumber,
  getOnboardingStepNumber,
} from "@/lib/onboarding";
import type { MeResponse } from "@/lib/types";

interface Props {
  step?: string;
  detailType?: string;
  importantType?: string;
  backHref?: string;
}

export function OnboardingStepProgress({ step = "region", detailType, importantType, backHref }: Props) {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  const directions = me?.onboarding?.interest_directions ?? [];

  let current = getOnboardingStepNumber(step, directions);
  if (detailType) current = getDetailStepNumber(detailType, directions);
  if (importantType) current = getImportantStepNumber(importantType, directions);

  return (
    <OnboardingProgressBar
      current={current}
      total={ONBOARDING_TOTAL_STEPS}
      backHref={backHref}
    />
  );
}
