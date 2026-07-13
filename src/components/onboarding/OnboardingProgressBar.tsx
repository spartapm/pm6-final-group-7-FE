"use client";

import Link from "next/link";

interface Props {
  current: number;
  total: number;
  backHref?: string;
}

export function OnboardingProgressBar({ current, total, backHref }: Props) {
  const pct = Math.round((current / total) * 100);
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
