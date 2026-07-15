"use client";

import { getAiSummaryLabel, truncateCardSummary } from "@/lib/ai-summary-display";
import { useAiSummary } from "@/hooks/useAiSummary";
import type { Activity } from "@/lib/types";

export function AiSummaryBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClasses =
    size === "sm"
      ? "h-[38px] w-[30px] rounded-[6px] text-[8px]"
      : "h-[44px] w-8 rounded-lg text-[9px]";

  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center bg-primary font-extrabold leading-none text-white ${sizeClasses}`}
      aria-label="AI 요약"
    >
      <span>AI</span>
      <span className="mt-1">요약</span>
    </div>
  );
}

function SummarySpinner({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-primary/30 border-t-primary ${
        compact ? "h-4 w-4" : "h-5 w-5"
      }`}
      aria-hidden
    />
  );
}

interface AiSummaryBlockProps {
  activity: Activity;
  expired?: boolean;
  compact?: boolean;
  mode?: "card" | "detail";
}

export function AiSummaryBlock({
  activity,
  expired = false,
  compact = false,
  mode = "card",
}: AiSummaryBlockProps) {
  const { summary, loading, error, cardSummary, hidden } = useAiSummary(activity);

  if (hidden) return null;
  if (!loading && (error || summary === "" || !summary)) {
    // hideable 소스는 빈 메시지 대신 숨김; 그 외는 빈 상태 문구
    if (
      activity.external_source === "tour_api" ||
      activity.external_source === "seoul_cultural_event" ||
      activity.external_source === "seoul_fifty_plus"
    ) {
      return null;
    }
  }

  const displayText = (() => {
    if (loading) return null;
    if (error || !summary) return "요약 정보가 아직 없어요.";
    if (mode === "detail") return summary;
    return cardSummary ?? truncateCardSummary(activity, summary);
  })();

  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-[#f3f4f6] pl-2 pr-4 py-3 ${
        expired ? "opacity-80" : ""
      } ${compact ? "mt-3" : "mt-4"}`}
    >
      <AiSummaryBadge size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="flex items-center gap-2">
            <SummarySpinner compact={compact} />
            <p className={`font-semibold text-text-muted ${compact ? "text-sm" : "text-base"}`}>
              AI 요약 생성 중...
            </p>
          </div>
        ) : (
          <p
            className={`font-semibold text-text-secondary ${
              compact ? "text-sm line-clamp-2" : mode === "detail" ? "text-base" : "text-base line-clamp-2"
            } ${expired ? "text-[#c7c7d1]" : ""}`}
          >
            {displayText}
          </p>
        )}
      </div>
    </div>
  );
}

interface AiSummarySectionProps {
  activity: Activity;
  variant?: "job" | "learning" | "support";
  bodyClass?: string;
}

function DefaultSection({
  title,
  headerClass,
  titleClass,
  children,
}: {
  title: string;
  headerClass: string;
  titleClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className={`border-b border-[#f3f4f6] px-4 py-3 ${headerClass}`}>
        <div className="flex items-center gap-2.5">
          <AiSummaryBadge size="md" />
          <p className={`text-[18px] font-black ${titleClass}`}>{title}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function AiSummarySection({
  activity,
  bodyClass,
}: AiSummarySectionProps) {
  const { summary, loading, error, hidden } = useAiSummary(activity);
  const label = getAiSummaryLabel(activity.category);

  if (hidden) return null;
  if (
    !loading &&
    (summary === "" || (!summary && !error)) &&
    (activity.external_source === "tour_api" ||
      activity.external_source === "seoul_cultural_event" ||
      activity.external_source === "seoul_fifty_plus")
  ) {
    return null;
  }

  const headerStyles = { header: "bg-[#eef0fb]", title: "text-[#4558b5]" };

  return (
    <DefaultSection
      title={label}
      headerClass={headerStyles.header}
      titleClass={headerStyles.title}
    >
      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-3">
            <SummarySpinner />
            <p className={`font-semibold text-text-muted ${bodyClass ?? "text-[18px]"}`}>
              AI 요약 생성 중...
            </p>
          </div>
        ) : (
          <p className={`leading-relaxed text-[#364153] ${bodyClass ?? "text-[18px]"}`}>
            {error || !summary ? "요약 정보가 아직 없어요." : summary}
          </p>
        )}
      </div>
    </DefaultSection>
  );
}

/** @deprecated AiSummaryBlock 사용 */
export function AiSummaryCard(props: {
  activity: Activity;
  summary: string;
  expired?: boolean;
  compact?: boolean;
}) {
  return (
    <AiSummaryBlock
      activity={{ ...props.activity, ai_summary: props.summary }}
      expired={props.expired}
      compact={props.compact}
    />
  );
}
