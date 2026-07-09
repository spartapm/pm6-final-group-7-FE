"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import {
  OnboardingFollowUpChips,
  OnboardingNextButton,
  OnboardingRadioCard,
  OnboardingTimeDayFollowUp,
} from "@/components/onboarding/OnboardingUI";
import { apiFetch } from "@/lib/api-client";
import {
  IMPORTANT_CONFIG,
  getImportantBackHref,
  getNextAfterImportant,
  getOnboardingCompletePath,
} from "@/lib/onboarding";
import type { MeResponse } from "@/lib/types";

/** SCR-008~010 중요 정보 + 조건부 질문 (Figma 1040:707 등) */
export default function OnboardingImportantPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();
  const config = IMPORTANT_CONFIG[type] ?? IMPORTANT_CONFIG.job;
  const [priority, setPriority] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<Record<string, string>>({});
  const [schedule, setSchedule] = useState<{ timeSlot: string | null; dayType: string | null }>({
    timeSlot: null,
    dayType: null,
  });
  const [loading, setLoading] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  const directions = me?.onboarding?.interest_directions ?? [];
  const infoKey =
    type === "job" ? "important_job_info" : type === "hobby" ? "important_hobby_info" : "important_learning_info";

  const activeFollowUp = priority ? config.followUps[priority] : null;

  function selectPriority(item: string) {
    setPriority(item);
    setFollowUp({});
    setSchedule({ timeSlot: null, dayType: null });
  }

  function isFollowUpComplete(): boolean {
    if (!priority || !activeFollowUp) return false;
    if (activeFollowUp.kind === "time_day") {
      return Boolean(schedule.timeSlot && schedule.dayType);
    }
    return Boolean(followUp[activeFollowUp.key]);
  }

  const canProceed = Boolean(priority && isFollowUpComplete());

  async function handleNext() {
    if (!canProceed || !priority) return;
    setLoading(true);
    try {
      const next = getNextAfterImportant(type, directions);
      const payload: Record<string, unknown> = { priority };

      if (activeFollowUp?.kind === "time_day") {
        payload.time_slot = schedule.timeSlot;
        payload.day_type = schedule.dayType;
      } else if (activeFollowUp?.kind === "chips") {
        payload[activeFollowUp.key] = followUp[activeFollowUp.key];
      }

      await apiFetch("/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          [infoKey]: payload,
          onboarding_step: next === "complete" ? "complete" : next.step,
        }),
      });

      if (next === "complete") {
        router.push(getOnboardingCompletePath());
      } else {
        router.push(next.path);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
      <OnboardingStepProgress
        importantType={type}
        backHref={getImportantBackHref(type, directions)}
      />

      <h1 className="text-[22px] font-bold leading-snug text-[#101828]">{config.question}</h1>
      <p className="mt-2 text-[15px] text-[#9a9da8]">하나를 선택해주세요</p>

      <div className="mt-6 space-y-2">
        {config.items.map((item) => (
          <OnboardingRadioCard
            key={item}
            label={item}
            selected={priority === item}
            onSelect={() => selectPriority(item)}
          >
            {(() => {
              const fu = config.followUps[item];
              if (!fu || priority !== item) return null;
              if (fu.kind === "time_day") {
                return (
                  <OnboardingTimeDayFollowUp value={schedule} onChange={setSchedule} />
                );
              }
              return (
                <OnboardingFollowUpChips
                  question={fu.question}
                  options={fu.options}
                  value={followUp[fu.key] ?? null}
                  onChange={(v) => setFollowUp((prev) => ({ ...prev, [fu.key]: v }))}
                  columns={fu.columns}
                />
              );
            })()}
          </OnboardingRadioCard>
        ))}
      </div>

      <OnboardingNextButton disabled={!canProceed} loading={loading} onClick={handleNext} />
    </div>
  );
}
