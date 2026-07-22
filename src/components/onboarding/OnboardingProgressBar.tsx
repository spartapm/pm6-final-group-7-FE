"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  current: number;
  total: number;
  backHref?: string;
}

const MAX_PCT_KEY = "obMaxPct";

/** 진행률 래칫: 뒤로 가도 게이지가 줄어들지 않도록 최대값 유지 */
function useRatchetedPct(currentPct: number): number {
  const [maxPct, setMaxPct] = useState(0);

  useEffect(() => {
    let stored = 0;
    try {
      stored = Number(sessionStorage.getItem(MAX_PCT_KEY)) || 0;
    } catch {
      /* ignore */
    }
    const next = Math.max(stored, currentPct);
    setMaxPct(next);
    if (next > stored) {
      try {
        sessionStorage.setItem(MAX_PCT_KEY, String(next));
      } catch {
        /* ignore */
      }
    }
  }, [currentPct]);

  return Math.max(currentPct, maxPct);
}

export function OnboardingProgressBar({ current, total, backHref }: Props) {
  const pct = useRatchetedPct(Math.round((current / total) * 100));
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="text-xl text-text-primary" aria-label="뒤로">
            ‹
          </Link>
        )}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
