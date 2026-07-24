"use client";

import Image from "next/image";
import { formatDeadline } from "@/components/ui/DeadlineBadge";
import { ASSETS } from "@/lib/assets";
import {
  getSupportApplyMethod,
  getSupportApplyPeriod,
  getSupportDescription,
  getSupportDocuments,
  getSupportSummaryRows,
  getSupportTags,
  getSupportTarget,
  isAlwaysOpenSupport,
} from "@/lib/support-detail";
import { AiSummarySection } from "@/components/activity/AiSummarySection";
import { BookmarkActionButton } from "@/components/activity/BookmarkActionButton";
import { getApplyButtonLabel } from "@/lib/apply-url";
import type { Activity } from "@/lib/types";

function SupportSectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="border-b border-[#f3f4f6] bg-[#eef0fb] px-4 py-3">
        <p className="text-[18px] font-black text-[#4558b5]">
          {icon} {title}
        </p>
      </div>
      {children}
    </div>
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

export function SupportDetailView({
  activity,
  loading,
  onBack,
  onBookmark,
  onApply,
  onShare,
}: Props) {
  const isExpired = activity.status === "expired";
  const alwaysOpen = isAlwaysOpenSupport(activity);
  const summaryRows = getSupportSummaryRows(activity);
  const tags = getSupportTags(activity);
  const applyPeriod = getSupportApplyPeriod(activity);
  const ddayLabel = alwaysOpen ? "상시" : formatDeadline(activity.apply_end).replace("일 전", "일전");
  const target = getSupportTarget(activity);
  const applyMethod = getSupportApplyMethod(activity);
  const documents = getSupportDocuments(activity);
  const description = getSupportDescription(activity);

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
          {/* M-3: 회색 배경 없이 아이콘만 */}
          <button type="button" aria-label="공유" onClick={onShare} className="p-2">
            <Image src={ASSETS.iconShare} alt="" width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4">
        <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <div className="h-[6px] bg-[#5b6dbf]" />
          <div className="p-5">
            <span className="inline-block rounded-full bg-[#eef0fb] px-2.5 py-1 text-[12px] font-black text-[#4558b5]">
              지원사업
            </span>
            <h2 className="mt-3 text-[18px] font-black leading-snug text-[#101828]">
              {activity.title}
            </h2>
            {applyPeriod && (
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f3f4f6] pt-4">
                <div>
                  <p className="text-[18px] text-[#99a1af]">신청 기간</p>
                  <p className="mt-1 text-[18px] font-semibold text-[#364153]">{applyPeriod}</p>
                </div>
                {!alwaysOpen && (
                  <span className="shrink-0 rounded-[14px] bg-[#f9fafb] px-4 py-2 text-[16px] font-black text-[#364153]">
                    {ddayLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {summaryRows.length > 0 && (
          <SupportSectionCard icon="📋" title="지원 요강">
            {summaryRows.map((row, index) => (
              <div
                key={row.label}
                className={`flex border-[#f3f4f6] ${index < summaryRows.length - 1 ? "border-b" : ""}`}
              >
                <div className="flex w-28 shrink-0 items-center bg-[#f9fafb] px-4 py-3">
                  <span className="text-[18px] font-bold text-[#4a5565]">{row.label}</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center px-4 py-3">
                  <span className="text-[18px] text-[#1e2939]">{row.value}</span>
                </div>
              </div>
            ))}
          </SupportSectionCard>
        )}

        <AiSummarySection activity={activity} variant="support" />

        {target && (
          <SupportSectionCard icon="👥" title="지원 대상">
            <p className="whitespace-pre-wrap break-words p-5 text-[18px] leading-relaxed text-[#364153]">
              {target}
            </p>
          </SupportSectionCard>
        )}

        {applyMethod && (
          <SupportSectionCard icon="📝" title="신청 방법">
            <p className="whitespace-pre-wrap break-words p-5 text-[18px] leading-relaxed text-[#364153]">
              {applyMethod}
            </p>
          </SupportSectionCard>
        )}

        {documents && (
          <SupportSectionCard icon="📎" title="구비 서류">
            <p className="whitespace-pre-wrap break-words p-5 text-[18px] leading-relaxed text-[#364153]">
              {documents}
            </p>
          </SupportSectionCard>
        )}

        {description && (
          <SupportSectionCard icon="💡" title="지원 내용">
            <p className="whitespace-pre-wrap break-words p-5 text-[18px] leading-relaxed text-[#364153]">
              {description}
            </p>
          </SupportSectionCard>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-[14px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#eef0fb] px-3 py-1.5 text-[14px] font-semibold text-[#4558b5]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="px-2 text-center text-[14px] text-[#9aa0a8]">
          개인별 적격 여부는 담당 기관에서 최종 확인됩니다.
        </p>
      </div>

      <div className="activity-action-bar fixed left-1/2 z-30 flex w-full max-w-[390px] -translate-x-1/2 gap-2 overflow-visible border-t border-[#e5e7eb] bg-white px-4 py-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
        <BookmarkActionButton
          bookmarked={Boolean(activity.bookmarked)}
          disabled={loading || isExpired}
          onClick={onBookmark}
        />
        <button
          type="button"
          disabled={isExpired}
          onClick={onApply}
          className="flex h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#5b6dbf] text-[16px] font-black text-white disabled:bg-gray-300"
        >
          {activity.applied ? "신청완료" : isExpired ? "마감됨" : getApplyButtonLabel(activity)}
        </button>
      </div>
    </div>
  );
}
