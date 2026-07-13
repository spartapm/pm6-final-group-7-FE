"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import {
  OnboardingCategoryTag,
  OnboardingNextButton,
} from "@/components/onboarding/OnboardingUI";
import { getDetailStepKey, getOrderedDirections } from "@/lib/onboarding";
import { apiFetch } from "@/lib/api-client";
import type { MeResponse } from "@/lib/types";

const OPTIONS = [
  { id: "job", emoji: "💼", title: "다시 일하고 싶어요", tag: "재취업·소득활동" },
  { id: "hobby", emoji: "🎯", title: "즐길 활동을 찾고 싶어요", tag: "취미·여가·봉사" },
  { id: "learning", emoji: "📚", title: "무언가를 배우고 싶어요", tag: "배움·자기계발" },
];

/** SCR-004 관심 방향 (Figma 1040:614) */
export default function OnboardingInterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    const dirs = me?.onboarding?.interest_directions;
    if (dirs && dirs.length > 0) setSelected(dirs);
  }, [me]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function handleNext() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const ordered = getOrderedDirections(selected);
      const first = ordered[0];
      await apiFetch("/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          interest_directions: ordered,
          onboarding_step: getDetailStepKey(first),
        }),
      });
      router.push(`/onboarding/detail/${first}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
      <OnboardingStepProgress step="interests" backHref="/onboarding/profile" />

      <h1 className="text-[22px] font-bold text-[#101828]">어떤 활동에 관심이 있으세요?</h1>
      <p className="mt-2 text-base text-[#9a9da8]">관심 있는 내용을 모두 선택해주세요</p>

      <div className="mt-6 space-y-3">
        {OPTIONS.map((o) => {
          const checked = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left ${
                checked ? "border-primary bg-[#eef0fb]" : "border-gray-200 bg-white"
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 ${
                  checked ? "border-primary bg-primary text-xs text-white" : "border-gray-300"
                }`}
              >
                {checked && "✓"}
              </span>
              <span className="text-lg">{o.emoji}</span>
              <span className="flex-1 text-lg font-bold text-[#101828]">{o.title}</span>
              <OnboardingCategoryTag label={o.tag} />
            </button>
          );
        })}
      </div>

      <OnboardingNextButton
        disabled={selected.length === 0}
        loading={loading}
        onClick={handleNext}
      />
    </div>
  );
}
