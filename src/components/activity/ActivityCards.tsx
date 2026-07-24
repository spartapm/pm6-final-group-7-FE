import type { Activity, UserOnboarding } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/onboarding";
import { DeadlineBadge, formatDeadline } from "@/components/ui/DeadlineBadge";
import { differenceInCalendarDays, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { AiSummaryBlock } from "@/components/activity/AiSummarySection";
import { formatScheduleDisplay } from "@/lib/scheduleDisplay";
import { ASSETS } from "@/lib/assets";
import { formatActivityRegion } from "@/lib/region-display";

interface Props {
  activity: Activity;
  reasons?: string[];
  showReasons?: boolean;
  expired?: boolean;
  onboarding?: UserOnboarding | null;
  bookmarked?: boolean;
  bookmarkLoading?: boolean;
  onBookmark?: () => void;
  /** 상세를 이미 확인한 활동 표시 */
  viewed?: boolean;
}

/** 지역 표기: 시·도 없으면 구·군만 (서울 가정 금지) */
function regionLabel(activity: Activity): string | null {
  return formatActivityRegion(activity);
}

export function ViewedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#eceef2] px-1.5 py-0.5 text-[10px] font-medium text-[#9a9aa5]">
      <Image
        src={ASSETS.iconViewedCheck}
        alt=""
        width={10}
        height={10}
        unoptimized
        className="opacity-80"
        aria-hidden
      />
      확인함
    </span>
  );
}

/** M-14: 취미 카드도 교육처럼 비용 노출 — cost/fee/is_free 순으로 탐색 */
function getCostLabel(activity: Activity): string | null {
  const a = activity.attributes ?? {};
  const cost = typeof a.cost === "string" && a.cost.trim() ? a.cost.trim() : null;
  if (cost) return cost;
  const isFree = typeof a.is_free === "string" ? a.is_free.trim() : "";
  if (isFree === "무료") return "무료";
  const fee = typeof a.fee === "string" && a.fee.trim() ? a.fee.trim() : null;
  if (fee) return fee;
  if (isFree === "유료") return "유료";
  return null;
}

// UI-04: 글자수 규칙(제목 28자·추천이유 25자, 초과 시 말줄임)
function truncateChars(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function ReasonBox({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl bg-[#f3f0fc] px-4 py-3">
      <p className="text-[16px] font-bold text-[#4b46d6]">추천이유</p>
      {reasons.map((r) => (
        <p key={r} className="mt-1 text-[16px] font-normal text-[#1a1a1a]">
          {truncateChars(r, 25)}
        </p>
      ))}
    </div>
  );
}

export function RecommendationCard({
  activity,
  reasons = [],
  showReasons = true,
  expired,
  onboarding,
  bookmarked,
  bookmarkLoading,
  onBookmark,
  viewed,
}: Props) {
  const isExpired = expired ?? activity.status === "expired";
  const isBookmarked = bookmarked ?? activity.bookmarked;

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border shadow-sm ${
        viewed ? "border-[#ECECEE] bg-[#FAFAFA]" : "border-gray-100 bg-white"
      } ${isExpired ? "opacity-70" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <h3
              className={`line-clamp-2 min-w-0 text-[18px] font-bold leading-snug ${
                isExpired ? "text-[#b4b4be]" : "text-text-primary"
              }`}
            >
              {truncateChars(activity.title, 28)}
            </h3>
            {viewed && <ViewedBadge />}
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {onBookmark && !isExpired && (
              <button
                type="button"
                disabled={bookmarkLoading}
                onClick={(e) => {
                  e.preventDefault();
                  onBookmark();
                }}
                className={`text-2xl ${isBookmarked ? "text-red-500" : "text-[#c7c7d1]"}`}
                aria-label="찜하기"
              >
                {isBookmarked ? "♥" : "♡"}
              </button>
            )}
            <DeadlineBadge applyEnd={activity.apply_end} />
          </div>
        </div>
        <p className={`mt-1 text-[15px] ${isExpired ? "text-[#c7c7d1]" : "text-[#9096a6]"}`}>
          {activity.org_name}
          {regionLabel(activity)
            ? ` · ${regionLabel(activity)}`
            : activity.category === "support"
              ? " · 전국"
              : ""}
        </p>

        {showReasons && <ReasonBox reasons={reasons} />}
        <AiSummaryBlock
          activity={activity}
          expired={isExpired}
          compact
        />
      </div>
      {isExpired ? (
        <div className="block bg-[#eceef2] py-3.5 text-center text-[17px] font-bold text-[#b9b9c4]">
          마감됨
        </div>
      ) : (
        <Link
          href={`/activities/${activity.id}`}
          className="block bg-primary py-3.5 text-center text-[15px] font-bold text-white"
        >
          상세보기
        </Link>
      )}
    </div>
  );
}

export function ActivityListCard({ activity }: { activity: Activity }) {
  return (
    <Link
      href={`/activities/${activity.id}`}
      className="mb-3 block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-bold text-primary-deep">
            {CATEGORY_LABELS[activity.category]}
          </span>
          <h3 className="mt-1 line-clamp-2 text-base font-bold text-text-primary">
            {truncateChars(activity.title, 28)}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {activity.org_name}
            {regionLabel(activity) ? ` · ${regionLabel(activity)}` : ""}
          </p>
        </div>
        <DeadlineBadge applyEnd={activity.apply_end} />
      </div>
      <AiSummaryBlock activity={activity} compact />
    </Link>
  );
}

function LearningDeadlineBadge({ applyEnd }: { applyEnd: string | null }) {
  const label = formatDeadline(applyEnd);
  const urgent =
    applyEnd &&
    differenceInCalendarDays(parseISO(applyEnd), new Date()) <= 3 &&
    label !== "마감";
  const expired = label === "마감";

  return (
    <span
      className={`shrink-0 rounded-md border px-2.5 py-1 text-[13px] font-bold ${
        expired
          ? "border-[#e5e7eb] bg-[#f8f9fc] text-[#9aa0a8]"
          : urgent
            ? "border-[#fecaca] bg-[#fef2f2] text-[#e1483e]"
            : "border-[#e5e7eb] bg-white text-[#9aa0a8]"
      }`}
    >
      {label}
    </span>
  );
}

export function LearningListCard({
  activity,
  bookmarked,
  bookmarkLoading,
  onBookmark,
  viewed,
}: {
  activity: Activity;
  bookmarked?: boolean;
  bookmarkLoading?: boolean;
  onBookmark?: () => void;
  viewed?: boolean;
}) {
  const isExpired = activity.status === "expired";
  const isBookmarked = bookmarked ?? activity.bookmarked;
  const costLabel = getCostLabel(activity);
  const isFree = costLabel?.includes("무료");
  const scheduleLabel = formatScheduleDisplay(activity.event_schedule);

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border shadow-sm ${
        viewed ? "border-[#ECECEE] bg-[#FAFAFA]" : "border-[#eceef2] bg-white"
      } ${isExpired ? "opacity-75" : ""}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <h3
              className={`line-clamp-2 min-w-0 text-[18px] font-bold leading-snug ${
                isExpired ? "text-[#b7bac3]" : "text-[#111318]"
              }`}
            >
              {truncateChars(activity.title, 28)}
            </h3>
            {viewed && <ViewedBadge />}
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {onBookmark && !isExpired && (
              <button
                type="button"
                disabled={bookmarkLoading}
                onClick={(e) => {
                  e.preventDefault();
                  onBookmark();
                }}
                className={`text-2xl ${isBookmarked ? "text-red-500" : "text-[#c7c7d1]"}`}
                aria-label="찜하기"
              >
                {isBookmarked ? "♥" : "♡"}
              </button>
            )}
            <LearningDeadlineBadge applyEnd={activity.apply_end} />
          </div>
        </div>

        <p className={`mt-2 text-[16px] ${isExpired ? "text-[#c7c7d1]" : "text-[#8a8f99]"}`}>
          {activity.org_name}
          {regionLabel(activity) ? ` · ${regionLabel(activity)}` : ""}
        </p>

        {(scheduleLabel || costLabel) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[15px]">
            {scheduleLabel && (
              <p className={isExpired ? "text-[#c7c7d1]" : "text-[#8a8f99]"}>
                🕐 {scheduleLabel}
              </p>
            )}
            {costLabel && (
              <p
                className={`font-bold ${
                  isExpired ? "text-[#c7c7d1]" : isFree ? "text-[#2e9e5b]" : "text-[#111318]"
                }`}
              >
                {costLabel}
              </p>
            )}
          </div>
        )}

        <AiSummaryBlock activity={activity} expired={isExpired} />
      </div>

      {isExpired ? (
        <div className="bg-[#eceef2] py-3.5 text-center text-[17px] font-bold text-[#b7bac3]">
          마감됨
        </div>
      ) : (
        <Link
          href={`/activities/${activity.id}`}
          className="block bg-primary py-3.5 text-center text-[17px] font-bold text-white"
        >
          상세보기
        </Link>
      )}
    </div>
  );
}
