"use client";

import Image from "next/image";
import { ASSETS } from "@/lib/assets";
import {
  getApplyPeriod,
  getDday,
  getLearningTheme,
  getProgramDescription,
  getProgramQualifications,
  getProgramRows,
  getProgramTags,
  isUrgentDeadline,
  type LearningTheme,
} from "@/lib/learning-detail";
import { AiSummarySection } from "@/components/activity/AiSummarySection";
import { BookmarkActionButton } from "@/components/activity/BookmarkActionButton";
import { getApplyButtonLabel } from "@/lib/apply-url";
import { formatActivityRegion } from "@/lib/region-display";
import type { Activity } from "@/lib/types";

function ProgramSectionCard({
  theme,
  icon,
  title,
  children,
}: {
  theme: LearningTheme;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="border-b border-[#f3f4f6] px-4 py-3" style={{ backgroundColor: theme.sectionBg }}>
        <p className="text-[18px] font-black" style={{ color: theme.sectionText }}>
          {icon} {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function HashTagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-3 py-1.5 text-[18px] font-semibold text-[#4a5565]">
      <span className="text-[#9aa0a8]">#</span>
      {label}
    </span>
  );
}

interface Props {
  activity: Activity;
  loading: boolean;
  onBack: () => void;
  onBookmark: () => void;
  onApply: () => void;
  onShare?: () => void;
}

export function LearningDetailView({
  activity,
  loading,
  onBack,
  onBookmark,
  onApply,
  onShare,
}: Props) {
  const theme = getLearningTheme(activity.category as "education" | "hobby");
  const isExpired = activity.status === "expired";
  const programRows = getProgramRows(activity);
  const tags = getProgramTags(activity);
  const dday = getDday(activity.apply_end);
  const urgent = isUrgentDeadline(activity.apply_end);
  const applyPeriod = getApplyPeriod(activity);
  const regionText = formatActivityRegion(activity);
  const description = getProgramDescription(activity);
  const qualifications = getProgramQualifications(activity);
  const hasApplyPeriod = Boolean(activity.apply_start || activity.apply_end);

  return (
    <div className="bg-[#f5f4ff] pb-[var(--activity-action-bar-height)]">
      <header className="sticky top-0 z-20 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-[#1e2939]"
            aria-label="뒤로"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[20px] font-bold text-[#1e2939]">
            {activity.title}
          </h1>
          <button type="button" aria-label="공유" onClick={onShare} className="p-2">
            <Image src={ASSETS.iconShare} alt="" width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4">
        <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <div className="h-[6px]" style={{ backgroundColor: theme.accent }} />
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-[12px] font-black"
                style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
              >
                {theme.categoryLabel}
              </span>
              {urgent && !isExpired && (
                <span className="rounded-full bg-[#ffe2e2] px-2.5 py-1 text-[12px] font-black text-[#e7000b]">
                  마감임박
                </span>
              )}
            </div>

            <h2 className="mt-3 text-[18px] font-black leading-snug text-[#101828]">
              {activity.title}
            </h2>

            {activity.org_name && (
              <div className="mt-3 flex items-center gap-1.5 text-[18px] font-semibold text-[#364153]">
                {activity.org_name}
              </div>
            )}
            {regionText && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[18px] text-[#4a5565]">
                <Image src={ASSETS.iconLocationPin} alt="" width={14} height={14} />
                {regionText}
              </div>
            )}

            {hasApplyPeriod && (
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f3f4f6] pt-4">
                <div>
                  <p className="text-[18px] text-[#99a1af]">신청 기간</p>
                  <p className="mt-1 text-[18px] font-semibold text-[#364153]">{applyPeriod}</p>
                </div>
                {dday !== null && !isExpired && (
                  <span className="shrink-0 rounded-[14px] bg-[#ffe2e2] px-4 py-2 text-[16px] font-black text-[#e7000b]">
                    D-{dday}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {programRows.length > 0 && (
          <ProgramSectionCard theme={theme} icon="📋" title="프로그램 요강">
            {programRows.map((row, index) => (
              <div
                key={row.label}
                className={`flex border-[#f3f4f6] ${index < programRows.length - 1 ? "border-b" : ""}`}
              >
                <div className="flex w-28 shrink-0 items-center bg-[#f9fafb] px-4 py-3">
                  <span className="text-[18px] font-bold text-[#4a5565]">{row.label}</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center px-4 py-3">
                  {row.withPin ? (
                    <span className="flex items-center gap-1 text-[18px] text-[#1e2939]">
                      {row.value}
                    </span>
                  ) : row.withClock ? (
                    <span className="flex items-center gap-1 text-[18px] text-[#1e2939]">
                      <Image src={ASSETS.iconCalendarSmall} alt="" width={12} height={12} />
                      {row.value}
                    </span>
                  ) : (
                    <span
                      className={`text-[18px] ${
                        row.red
                          ? "font-bold text-[#e7000b]"
                          : row.green
                            ? "font-bold text-[#00a63e]"
                            : row.bold
                              ? "font-bold text-[#1e2939]"
                              : "text-[#1e2939]"
                      }`}
                    >
                      {row.value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </ProgramSectionCard>
        )}

        <AiSummarySection activity={activity} variant="learning" />

        {description && (
          <ProgramSectionCard theme={theme} icon="✏️" title="프로그램 소개">
            <p className="whitespace-pre-wrap break-words p-5 text-[18px] leading-relaxed text-[#364153]">
              {description}
            </p>
          </ProgramSectionCard>
        )}

        {qualifications && (
          <ProgramSectionCard theme={theme} icon="📝" title="지원 자격 / 신청 조건">
            <p className="whitespace-pre-wrap break-words p-5 text-[18px] leading-relaxed text-[#364153]">
              {qualifications}
            </p>
          </ProgramSectionCard>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-[14px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            {tags.map((tag) => (
              <HashTagPill key={tag} label={tag} />
            ))}
          </div>
        )}
      </div>

      <div className="activity-action-bar fixed left-1/2 z-30 flex w-full max-w-[390px] -translate-x-1/2 gap-2 overflow-visible border-t border-[#e5e7eb] bg-white px-4 py-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
        <BookmarkActionButton
          bookmarked={Boolean(activity.bookmarked)}
          disabled={loading || isExpired}
          onClick={onBookmark}
          accentBorder={theme.accentBorder}
        />
        <button
          type="button"
          disabled={isExpired}
          onClick={onApply}
          className="flex h-[52px] flex-1 items-center justify-center rounded-2xl text-[16px] font-black text-white disabled:bg-gray-300"
          style={{ backgroundColor: isExpired ? undefined : theme.accent }}
        >
          {activity.applied
            ? "신청완료"
            : isExpired
              ? "마감됨"
              : getApplyButtonLabel(activity)}
        </button>
      </div>
    </div>
  );
}
