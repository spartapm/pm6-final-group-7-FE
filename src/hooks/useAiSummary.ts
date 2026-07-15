"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCachedSummary,
  requestActivitySummary,
  setCachedSummary,
} from "@/lib/ai-summary-queue";
import {
  buildSummaryLead,
  isStaleAiSummary,
  shouldHideAiSummary,
  truncateCardSummary,
} from "@/lib/ai-summary-display";
import { apiFetch } from "@/lib/api-client";
import type { Activity, MeResponse } from "@/lib/types";

export function needsAiSummaryGeneration(activity: Activity): boolean {
  // 의도적 빈 요약은 재생성하지 않음
  if (activity.ai_summary === "") return false;
  if (shouldHideAiSummary(activity, activity.ai_summary) && activity.ai_summary === "") {
    return false;
  }
  return isStaleAiSummary(activity.ai_summary);
}

/** 세션 캐시 또는 활동에 이미 담긴 유효한 요약을 동기적으로 찾는다. */
function resolveSeedSummary(activity: Activity): string | null {
  const cached = getCachedSummary(activity.id);
  if (cached !== undefined && cached !== null) return cached;
  if (activity.ai_summary === "") return "";
  const initial = activity.ai_summary?.trim();
  if (initial && !isStaleAiSummary(initial)) return initial;
  return null;
}

export function useAiSummary(activity: Activity) {
  const seed = resolveSeedSummary(activity);
  const [summary, setSummary] = useState<string | null>(seed);
  const [loading, setLoading] = useState(seed !== null ? false : needsAiSummaryGeneration(activity));
  const [error, setError] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    staleTime: 5 * 60 * 1000,
  });
  const lead = buildSummaryLead(activity, me?.onboarding ?? null);

  useEffect(() => {
    const cached = getCachedSummary(activity.id);
    if (cached !== undefined && cached !== null) {
      setSummary(cached);
      setLoading(false);
      setError(false);
      return;
    }

    if (activity.ai_summary === "") {
      setCachedSummary(activity.id, "");
      setSummary("");
      setLoading(false);
      setError(false);
      return;
    }

    const initial = activity.ai_summary?.trim();
    const shouldGenerate = isStaleAiSummary(activity.ai_summary);

    if (initial && !shouldGenerate) {
      setCachedSummary(activity.id, initial);
      setSummary(initial);
      setLoading(false);
      setError(false);
      return;
    }

    if (!shouldGenerate && !initial) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    if (initial && shouldGenerate) setSummary(null);

    requestActivitySummary(activity.id, { force: Boolean(initial && shouldGenerate) })
      .then((text) => {
        if (cancelled) return;
        setSummary(text);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activity.id, activity.ai_summary]);

  const hidden = shouldHideAiSummary(activity, summary);
  const summaryWithLead =
    summary && summary !== "" ? `${lead}${summary}` : summary === "" ? "" : summary;

  return {
    summary: summaryWithLead,
    loading: hidden ? false : loading,
    error,
    hidden,
    cardSummary:
      summaryWithLead && summaryWithLead !== ""
        ? truncateCardSummary(activity, summaryWithLead)
        : summaryWithLead === ""
          ? ""
          : null,
  };
}
