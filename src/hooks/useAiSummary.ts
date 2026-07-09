"use client";

import { useEffect, useState } from "react";
import { requestActivitySummary } from "@/lib/ai-summary-queue";
import { isStaleAiSummary, truncateForCard } from "@/lib/ai-summary-display";
import type { Activity } from "@/lib/types";

export function needsAiSummaryGeneration(activity: Activity): boolean {
  return isStaleAiSummary(activity.ai_summary);
}

export function useAiSummary(activity: Activity) {
  const [summary, setSummary] = useState<string | null>(activity.ai_summary?.trim() || null);
  const [loading, setLoading] = useState(needsAiSummaryGeneration(activity));
  const [error, setError] = useState(false);

  useEffect(() => {
    const initial = activity.ai_summary?.trim();
    const shouldGenerate = isStaleAiSummary(initial);

    if (initial && !shouldGenerate) {
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

  return {
    summary,
    loading,
    error,
    cardSummary: summary ? truncateForCard(summary) : null,
  };
}
