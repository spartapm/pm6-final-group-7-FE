"use client";

import Image from "next/image";
import { format, parseISO } from "date-fns";
import { formatDeadline } from "@/components/ui/DeadlineBadge";
import { ASSETS } from "@/lib/assets";
import {
  getJobBenefits,
  getJobDescription,
  getJobQualifications,
  getJobSummaryRows,
  getJobTags,
} from "@/lib/job-detail";
import { AiSummarySection } from "@/components/activity/AiSummarySection";
import type { Activity } from "@/lib/types";

function JobSectionCard({
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
      <div className="border-b border-[#f3f4f6] bg-[#dbeafe] px-4 py-3">
        <p className="text-[18px] font-black text-[#1d4ed8]">
          {icon} {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function JobDeadlineBadge({ applyEnd }: { applyEnd: string | null }) {
  const label = formatDeadline(applyEnd).replace("일 전", "일전");
  return (
    <span className="shrink-0 rounded-[14px] bg-[#f9fafb] px-4 py-2 text-[16px] font-black text-[#364153]">
      {label}
    </span>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-3 py-1.5 text-[18px] font-semibold text-[#4a5565]">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2 2h5l3 3v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
          stroke="#9aa0a8"
          strokeWidth="1.2"
        />
        <circle cx="4.5" cy="4.5" r="0.8" fill="#9aa0a8" />
      </svg>
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

export function JobDetailView({
  activity,
  loading,
  onBack,
  onBookmark,
  onApply,
  onShare,
}: Props) {
  const isExpired = activity.status === "expired";
  const summaryRows = getJobSummaryRows(activity);
  const benefits = getJobBenefits(activity);
  const tags = getJobTags(activity);
  const applyPeriod =
    activity.apply_start && activity.apply_end
      ? `${format(parseISO(activity.apply_start), "M월 d일")} ~ ${format(parseISO(activity.apply_end), "M월 d일")}`
      : activity.apply_end
        ? `~ ${format(parseISO(activity.apply_end), "M월 d일")}`
        : "상시 접수";

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
          <button
            type="button"
            aria-label="공유"
            onClick={onShare}
            className="rounded-2xl border border-[#e5e7eb] p-3"
          >
            <Image src={ASSETS.iconShare} alt="" width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4">
        <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <div className="h-[6px] bg-[#2563eb]" />
          <div className="p-5">
            <span className="inline-block rounded-full bg-[#dbeafe] px-2.5 py-1 text-[12px] font-black text-[#1d4ed8]">
              채용
            </span>
            <h2 className="mt-3 text-[18px] font-black leading-snug text-[#101828]">
              {activity.title}
            </h2>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f3f4f6] pt-4">
              <div>
                <p className="text-[18px] text-[#99a1af]">신청 기간</p>
                <p className="mt-1 text-[18px] font-semibold text-[#364153]">{applyPeriod}</p>
              </div>
              <JobDeadlineBadge applyEnd={activity.apply_end} />
            </div>
          </div>
        </div>

        {summaryRows.length > 0 && (
          <JobSectionCard icon="📋" title="채용 요강">
            {summaryRows.map((row, index) => (
              <div
                key={row.label}
                className={`flex border-[#f3f4f6] ${index < summaryRows.length - 1 ? "border-b" : ""}`}
              >
                <div className="flex w-28 shrink-0 items-center bg-[#f9fafb] px-4 py-3">
                  <span className="text-[18px] font-bold text-[#4a5565]">{row.label}</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center px-4 py-3">
                  {row.withPin ? (
                    <span className="flex items-center gap-1 text-[18px] text-[#1e2939]">
                      <span aria-hidden>📍</span>
                      {row.value}
                    </span>
                  ) : (
                    <span
                      className={`text-[18px] text-[#1e2939] ${row.bold ? "font-bold" : "font-normal"}`}
                    >
                      {row.value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </JobSectionCard>
        )}

        <AiSummarySection activity={activity} variant="job" />

        <JobSectionCard icon="💼" title="업무 내용">
          <p className="p-5 text-[18px] leading-relaxed text-[#364153]">
            {getJobDescription(activity)}
          </p>
        </JobSectionCard>

        <JobSectionCard icon="📝" title="지원 자격 / 신청 조건">
          <p className="p-5 text-[18px] leading-relaxed text-[#364153]">
            {getJobQualifications(activity)}
          </p>
        </JobSectionCard>

        {benefits.length > 0 && (
          <JobSectionCard icon="🎁" title="복리후생">
            <div className="flex flex-wrap gap-2 p-5">
              {benefits.map((benefit) => (
                <span
                  key={benefit}
                  className="rounded-full bg-[#dbeafe] px-3 py-1.5 text-[18px] font-semibold text-[#1d4ed8]"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </JobSectionCard>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-[14px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            {tags.map((tag) => (
              <TagPill key={tag} label={tag} />
            ))}
          </div>
        )}
      </div>

      <div className="activity-action-bar fixed left-1/2 z-30 flex w-full max-w-[390px] -translate-x-1/2 gap-2 border-t border-[#e5e7eb] bg-white px-4 py-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          disabled={loading || isExpired}
          onClick={onBookmark}
          className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border-[1.5px] text-2xl ${
            activity.bookmarked ? "border-[#2563eb] text-red-500" : "border-[#e5e7eb] text-[#9aa0a8]"
          }`}
          aria-label="찜하기"
        >
          {activity.bookmarked ? "♥" : "♡"}
        </button>
        <button
          type="button"
          disabled={isExpired || activity.applied}
          onClick={onApply}
          className="flex h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#2563eb] text-[16px] font-black text-white disabled:bg-gray-300"
        >
          {activity.applied ? "신청완료" : isExpired ? "마감됨" : "신청하러 가기"}
        </button>
      </div>
    </div>
  );
}
