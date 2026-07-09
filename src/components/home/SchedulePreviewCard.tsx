import Link from "next/link";
import { DeadlineBadge } from "@/components/ui/DeadlineBadge";
import { CATEGORY_LABELS } from "@/lib/onboarding";
import { ASSETS } from "@/lib/assets";
import { format, parseISO } from "date-fns";

interface Props {
  title: string;
  category: string;
  applyEnd: string | null;
  eventDate?: string | null;
  district?: string | null;
  activityId: string;
}

export function SchedulePreviewCard({
  title,
  category,
  applyEnd,
  eventDate,
  district,
  activityId,
}: Props) {
  const dateLabel = eventDate
    ? format(parseISO(eventDate), "M월 d일")
    : applyEnd
      ? format(parseISO(applyEnd), "M월 d일")
      : "";

  return (
    <div className="mx-5 -mt-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-[18px] w-[18px] shrink-0 bg-[#6D74D0]"
            style={{
              WebkitMask: `url('${ASSETS.tabJobs}') center / contain no-repeat`,
              mask: `url('${ASSETS.tabJobs}') center / contain no-repeat`,
            }}
            aria-hidden
          />
          <p className="text-base font-extrabold text-text-primary">다가오는 내 일정</p>
        </div>
        <Link href="/calendar" className="text-sm font-semibold text-[#5c68b8]">
          더보기 &gt;
        </Link>
      </div>
      <div className="my-3 h-px bg-gray-100" />
      <Link href={`/activities/${activityId}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <DeadlineBadge applyEnd={applyEnd} variant="outline" />
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  category === "education"
                    ? "bg-pink-50 text-category-education"
                    : "bg-primary/10 text-primary-deep"
                }`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </span>
            </div>
            <p className="mt-2 text-base font-bold text-text-primary">{title}</p>
            {(dateLabel || district) && (
              <p className="mt-1 text-[13.5px] text-text-muted">
                {dateLabel}
                {district ? ` · 서울 ${district}` : ""}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
