import type { Activity, UserOnboarding } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/onboarding";
import { DeadlineBadge, formatDeadline } from "@/components/ui/DeadlineBadge";
import { differenceInCalendarDays, parseISO } from "date-fns";
import Link from "next/link";
import { AiSummaryBlock } from "@/components/activity/AiSummarySection";

interface Props {
  activity: Activity;
  reasons?: string[];
  showReasons?: boolean;
  expired?: boolean;
  onboarding?: UserOnboarding | null;
  bookmarked?: boolean;
  bookmarkLoading?: boolean;
  onBookmark?: () => void;
}

function ReasonBox({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl bg-[#f3f0fc] px-4 py-3">
      <p className="text-base font-bold text-primary-deep">추천이유</p>
      {reasons.map((r) => (
        <p key={r} className="mt-1 text-base font-semibold text-[#1f2937]">
          {r}
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
}: Props) {
  const isExpired = expired ?? activity.status === "expired";
  const isBookmarked = bookmarked ?? activity.bookmarked;

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${
        isExpired ? "opacity-70" : ""
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`flex-1 text-[19px] font-extrabold ${
              isExpired ? "text-[#b4b4be]" : "text-text-primary"
            }`}
          >
            {activity.title}
          </h3>
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
          {activity.region_district
            ? ` · 서울 ${activity.region_district}`
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
          className="block bg-primary py-3.5 text-center text-[17px] font-extrabold text-white"
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
          <span
            className={`text-xs font-bold ${
              activity.category === "education"
                ? "text-category-education"
                : "text-primary-deep"
            }`}
          >
            {CATEGORY_LABELS[activity.category]}
          </span>
          <h3 className="mt-1 text-base font-bold text-text-primary">{activity.title}</h3>
          <p className="mt-1 text-sm text-text-muted">
            {activity.org_name}
            {activity.region_district ? ` · 서울 ${activity.region_district}` : ""}
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
}: {
  activity: Activity;
  bookmarked?: boolean;
  bookmarkLoading?: boolean;
  onBookmark?: () => void;
}) {
  const isExpired = activity.status === "expired";
  const isBookmarked = bookmarked ?? activity.bookmarked;
  const cost = activity.attributes?.cost;
  const costLabel = typeof cost === "string" ? cost : null;
  const isFree = costLabel?.includes("무료");

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border border-[#eceef2] bg-white shadow-sm ${
        isExpired ? "opacity-75" : ""
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`flex-1 text-[18px] font-bold leading-snug ${
              isExpired ? "text-[#b7bac3]" : "text-[#111318]"
            }`}
          >
            {activity.title}
          </h3>
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
          {activity.region_district ? ` · 서울 ${activity.region_district}` : ""}
        </p>

        {(activity.event_schedule || costLabel) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[15px]">
            {activity.event_schedule && (
              <p className={isExpired ? "text-[#c7c7d1]" : "text-[#8a8f99]"}>
                🕐 {activity.event_schedule}
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
