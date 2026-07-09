"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { DeadlineBadge } from "@/components/ui/DeadlineBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ASSETS } from "@/lib/assets";
import { apiFetch } from "@/lib/api-client";
import { applyApplicationOptimistic, patchActivityApplied } from "@/lib/optimistic-application";
import { CATEGORY_LABELS } from "@/lib/onboarding";
import {
  CATEGORY_TAG_STYLES,
  formatApplyPeriod,
  isActivityExpired,
  type CalendarItem,
} from "@/lib/calendar-utils";

interface Props {
  item: CalendarItem;
}

export function CalendarEventCard({ item }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const { activity, bookmarked, applied } = item;
  const expired = isActivityExpired(activity);
  const tagStyle = CATEGORY_TAG_STYLES[activity.category];

  async function handleBookmark() {
    setLoading(true);
    try {
      await apiFetch(`/activities/${activity.id}/bookmark`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["activity", activity.id] });
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyToggle() {
    if (applied) {
      patchActivityApplied(queryClient, activity.id, false);
      try {
        await applyApplicationOptimistic(queryClient, activity.id, false);
      } catch {
        // rollback handled in helper
      }
      return;
    }
    setApplyConfirmOpen(true);
  }

  function confirmApply() {
    setApplyConfirmOpen(false);
    patchActivityApplied(queryClient, activity.id, true);
    void applyApplicationOptimistic(queryClient, activity.id, true);
  }

  return (
    <>
      <div
        className={`mb-3 overflow-hidden rounded-2xl border border-[#eceef2] bg-white shadow-sm ${
          expired ? "opacity-70" : ""
        }`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${tagStyle.bg} ${tagStyle.text}`}
              >
                {CATEGORY_LABELS[activity.category]}
              </span>
              {applied && (
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                  신청완료
                </span>
              )}
              {bookmarked && !applied && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  찜
                </span>
              )}
            </div>
            <DeadlineBadge applyEnd={activity.apply_end} />
          </div>

          <p className={`mt-2 text-[17px] font-bold ${expired ? "text-[#b4b4be]" : "text-[#1c1c27]"}`}>
            {activity.title}
          </p>
          <p className="mt-1 text-sm text-[#9096a6]">{activity.org_name}</p>

          {activity.region_district && (
            <p className="mt-2 flex items-center gap-1 text-sm text-[#6b7280]">
              <Image src={ASSETS.iconLocationPin} alt="" width={12} height={14} />
              서울 {activity.region_district}
            </p>
          )}

          <p className="mt-1.5 flex items-center gap-1 text-sm text-[#6b7280]">
            <Image src={ASSETS.iconCalendarSmall} alt="" width={14} height={14} />
            {formatApplyPeriod(activity)}
            {activity.apply_end && (
              <span className="text-[#9aa0a8]">
                · 마감 {format(parseISO(activity.apply_end), "M/d")}
              </span>
            )}
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={loading || expired}
              onClick={handleBookmark}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
                bookmarked ? "border-primary text-red-500" : "border-gray-200 text-[#9aa0a8]"
              }`}
              aria-label="찜하기"
            >
              {bookmarked ? "♥" : "♡"}
            </button>
            <button
              type="button"
              disabled={loading || expired}
              onClick={handleApplyToggle}
              className={`flex-1 rounded-xl border py-2 text-sm font-bold ${
                applied
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-[#4b5563]"
              }`}
            >
              {applied ? "신청완료 ✓" : "신청 전"}
            </button>
            <Link
              href={`/activities/${activity.id}`}
              className="flex flex-1 items-center justify-center rounded-xl bg-primary py-2 text-sm font-bold text-white"
            >
              상세 보기
            </Link>
          </div>
        </div>
        {expired && (
          <div className="bg-[#eceef2] py-2 text-center text-sm font-bold text-[#b9b9c4]">
            마감됨
          </div>
        )}
      </div>

      <ConfirmModal
        open={applyConfirmOpen}
        title="신청을 완료하셨나요?"
        description="외부 사이트에서 신청을 마치셨다면 신청완료로 표시해주세요."
        confirmLabel="신청 완료"
        cancelLabel="아니요"
        onConfirm={confirmApply}
        onCancel={() => setApplyConfirmOpen(false)}
      />
    </>
  );
}
