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
  CATEGORY_DOT_COLORS,
  CATEGORY_TAG_STYLES,
  formatApplyPeriod,
  isActivityExpired,
  type CalendarItem,
} from "@/lib/calendar-utils";
import { useAuthAction } from "@/providers/AuthActionProvider";

interface Props {
  item: CalendarItem;
  /** H-4: 찜 해제 성공 시 상위에 알림 (리스트에서 즉시 제거하지 않기 위함) */
  onUnbookmarked?: (item: CalendarItem) => void;
}

export function CalendarEventCard({ item, onUnbookmarked }: Props) {
  const queryClient = useQueryClient();
  const { requireAuth } = useAuthAction();
  const [loading, setLoading] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [cancelApplyOpen, setCancelApplyOpen] = useState(false);
  const [cancelBookmarkOpen, setCancelBookmarkOpen] = useState(false);
  const { activity, bookmarked, applied } = item;
  const expired = isActivityExpired(activity);
  const tagStyle = CATEGORY_TAG_STYLES[activity.category];
  const categoryColor = CATEGORY_DOT_COLORS[activity.category];

  async function doToggleBookmark() {
    setLoading(true);
    try {
      await apiFetch(`/activities/${activity.id}/bookmark`, { method: "POST" });
      if (bookmarked) {
        onUnbookmarked?.({ ...item, bookmarked: false });
      }
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["activity", activity.id] });
    } finally {
      setLoading(false);
    }
  }

  function handleBookmark() {
    void requireAuth(
      async () => {
        if (bookmarked) {
          setCancelBookmarkOpen(true);
          return;
        }
        await doToggleBookmark();
      },
      {
        reason: "bookmark",
        returnTo: "/calendar",
        intent: { type: "bookmark", activityId: activity.id },
      }
    );
  }

  function confirmCancelBookmark() {
    setCancelBookmarkOpen(false);
    void doToggleBookmark();
  }

  function handleApplyToggle() {
    void requireAuth(
      async () => {
        if (applied) {
          setCancelApplyOpen(true);
          return;
        }
        setApplyConfirmOpen(true);
      },
      {
        reason: "applySave",
        returnTo: "/calendar",
        intent: applied
          ? { type: "applyCancel", activityId: activity.id }
          : { type: "applySave", activityId: activity.id },
      }
    );
  }

  function confirmCancelApply() {
    setCancelApplyOpen(false);
    patchActivityApplied(queryClient, activity.id, false);
    void applyApplicationOptimistic(queryClient, activity.id, false);
  }

  function confirmApply() {
    setApplyConfirmOpen(false);
    patchActivityApplied(queryClient, activity.id, true);
    void applyApplicationOptimistic(queryClient, activity.id, true);
  }

  return (
    <>
      <div
        data-deadline={
          activity.apply_end ? format(parseISO(activity.apply_end), "yyyy-MM-dd") : undefined
        }
        data-activity-id={activity.id}
        className={`mb-3 overflow-hidden rounded-2xl border border-[#eceef2] bg-white shadow-sm ${
          expired ? "opacity-70" : ""
        }`}
        style={{ borderLeft: `4px solid ${categoryColor}` }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${tagStyle.bg} ${tagStyle.text}`}
            >
              {CATEGORY_LABELS[activity.category]}
            </span>
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
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={loading || expired}
              onClick={handleBookmark}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
                bookmarked
                  ? "border-red-200 bg-red-50 text-red-500"
                  : "border-gray-200 bg-white text-[#9aa0a8]"
              }`}
              aria-label="찜하기"
              aria-pressed={bookmarked}
            >
              {bookmarked ? "♥" : "♡"}
            </button>
            <button
              type="button"
              disabled={loading || expired}
              onClick={handleApplyToggle}
              className={`flex-1 rounded-xl border py-2 text-sm font-bold ${
                applied
                  ? "border-primary bg-primary text-white"
                  : "border-[#e6e8ef] bg-white text-[#6b7280]"
              }`}
            >
              {applied ? "신청완료" : "신청전"}
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
        confirmLabel="예"
        cancelLabel="아니요"
        onConfirm={confirmApply}
        onCancel={() => setApplyConfirmOpen(false)}
      />

      <ConfirmModal
        open={cancelApplyOpen}
        title="신청완료를 취소하시겠어요?"
        description="취소하면 내 캘린더의 신청완료 표시가 사라져요."
        confirmLabel="예"
        cancelLabel="아니요"
        onConfirm={confirmCancelApply}
        onCancel={() => setCancelApplyOpen(false)}
      />

      <ConfirmModal
        open={cancelBookmarkOpen}
        title="찜하기를 취소하시겠습니까?"
        confirmLabel="예"
        cancelLabel="아니요"
        onConfirm={confirmCancelBookmark}
        onCancel={() => setCancelBookmarkOpen(false)}
      />
    </>
  );
}
