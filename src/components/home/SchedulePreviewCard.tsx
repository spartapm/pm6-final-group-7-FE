import Link from "next/link";
import { DeadlineBadge } from "@/components/ui/DeadlineBadge";
import { CATEGORY_LABELS } from "@/lib/onboarding";
import { ASSETS } from "@/lib/assets";
import { format, parseISO } from "date-fns";

export interface SchedulePreviewItem {
  activityId: string;
  title: string;
  category: string;
  applyEnd: string | null;
  eventDate?: string | null;
  district?: string | null;
}

interface Props {
  items: SchedulePreviewItem[];
}

function ScheduleRow({ item }: { item: SchedulePreviewItem }) {
  const dateLabel = item.eventDate
    ? format(parseISO(item.eventDate), "M월 d일")
    : item.applyEnd
      ? format(parseISO(item.applyEnd), "M월 d일")
      : "";

  return (
    <Link href={`/activities/${item.activityId}`} className="block">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <DeadlineBadge applyEnd={item.applyEnd} variant="outline" />
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-deep">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">{item.title}</p>
          {(dateLabel || item.district) && (
            <p className="mt-1 text-[13.5px] text-text-muted">
              {dateLabel}
              {item.district ? ` · 서울 ${item.district}` : ""}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SchedulePreviewCard({ items }: Props) {
  if (items.length === 0) return null;

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
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.activityId}>
            {index > 0 && <div className="mb-4 h-px bg-gray-50" />}
            <ScheduleRow item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
