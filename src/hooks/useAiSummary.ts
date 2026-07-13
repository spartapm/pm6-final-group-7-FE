"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCachedSummary,
  requestActivitySummary,
  setCachedSummary,
} from "@/lib/ai-summary-queue";
import { buildSummaryLead, isStaleAiSummary, truncateForCard } from "@/lib/ai-summary-display";
import { apiFetch } from "@/lib/api-client";
import type { Activity, MeResponse } from "@/lib/types";

export function needsAiSummaryGeneration(activity: Activity): boolean {
  return isStaleAiSummary(activity.ai_summary);
}

/** 세션 캐시 또는 활동에 이미 담긴 유효한 요약을 동기적으로 찾는다. */
function resolveSeedSummary(activity: Activity): string | null {
  const cached = getCachedSummary(activity.id);
  if (cached) return cached;
  const initial = activity.ai_summary?.trim();
  if (initial && !isStaleAiSummary(initial)) return initial;
  return null;
}

export function useAiSummary(activity: Activity) {
  const seed = resolveSeedSummary(activity);
  const [summary, setSummary] = useState<string | null>(seed);
  const [loading, setLoading] = useState(seed ? false : needsAiSummaryGeneration(activity));
  const [error, setError] = useState(false);

  // 문제2: 온보딩 중요 항목(급여·비용 등) 기반 서두를 요약 앞에 붙인다.
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    staleTime: 5 * 60 * 1000,
  });
  const lead = buildSummaryLead(activity, me?.onboarding ?? null);

  useEffect(() => {
    // 이미 세션 캐시에 있으면 재요청 없이 즉시 사용 (탭/화면 전환 시 재로딩 방지)
    const cached = getCachedSummary(activity.id);
    if (cached) {
      setSummary(cached);
      setLoading(false);
      setError(false);
      return;
    }

    const initial = activity.ai_summary?.trim();
    const shouldGenerate = isStaleAiSummary(initial);

    if (initial && !shouldGenerate) {
      setCachedSummary(activity.id, initial);
      setSummary(initial);
      setLoading(false);
      setError(false);
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

  const summaryWithLead = summary ? `${lead}${summary}` : summary;

  return {
    summary: summaryWithLead,
    loading,
    error,
    cardSummary: summary ? truncateForCard(`${lead}${summary}`) : null,
  };
}
