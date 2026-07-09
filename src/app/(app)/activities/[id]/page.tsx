"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DeadlineBadge } from "@/components/ui/DeadlineBadge";
import { LikeCompleteDialog } from "@/components/activity/LikeCompleteDialog";
import { JobDetailView } from "@/components/activity/JobDetailView";
import { LearningDetailView } from "@/components/activity/LearningDetailView";
import { SupportDetailView } from "@/components/activity/SupportDetailView";
import { apiFetch } from "@/lib/api-client";
import { openApplyUrl } from "@/lib/apply-url";
import { CATEGORY_LABELS } from "@/lib/onboarding";
import type { Activity, MeResponse } from "@/lib/types";
import { useAuthAction } from "@/providers/AuthActionProvider";
import { shareActivity } from "@/lib/share";
import { useToast } from "@/components/ui/Toast";
import { ASSETS } from "@/lib/assets";
import { AiSummarySection } from "@/components/activity/AiSummarySection";
import { resolveDetailSummary } from "@/lib/ai-summary-display";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { format, parseISO } from "date-fns";

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="bg-[#eef1fb] px-4 py-3">
        <p className="text-[17px] font-bold text-[#3f4a8c]">
          {icon} {title}
        </p>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-gray-100 py-3 last:border-0">
      <span className="w-24 shrink-0 text-base text-[#8a8f99]">{label}</span>
      <span className="flex-1 text-[17px] font-bold text-text-primary">{value}</span>
    </div>
  );
}

export default function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const { requireAuth } = useAuthAction();
  const [likeDialogOpen, setLikeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => apiFetch<Activity>(`/activities/${id}`),
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  async function handleBookmark() {
    await requireAuth(async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ bookmarked: boolean }>(`/activities/${id}/bookmark`, {
          method: "POST",
        });
        await queryClient.invalidateQueries({ queryKey: ["activity", id] });
        await queryClient.invalidateQueries({ queryKey: ["calendar"] });
        if (res.bookmarked && !me?.preferences?.dismiss_like_popup) {
          setLikeDialogOpen(true);
        } else if (res.bookmarked) {
          showToast("찜 목록에 추가했어요");
        } else {
          showToast("찜을 해제했어요");
        }
      } finally {
        setLoading(false);
      }
    });
  }

  async function handleApply() {
    await requireAuth(async () => {
      if (activity?.applied) {
        if (!openApplyUrl(activity)) {
          showToast("신청 링크가 없습니다. 담당 기관에 문의해 주세요.");
        }
        return;
      }

      await apiFetch(`/activities/${id}/apply-click`, { method: "POST" });
      if (!openApplyUrl(activity!)) {
        showToast("신청 링크가 없습니다. 담당 기관에 문의해 주세요.");
      }
    });
  }

  async function handleShare() {
    if (!activity) return;
    const result = await shareActivity(activity);
    if (result === "clipboard") {
      showToast("링크를 복사했어요.");
    } else if (result === "unsupported") {
      showToast("공유를 지원하지 않는 환경이에요.");
    }
  }

  async function dismissLikePopup() {
    await apiFetch("/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({ dismiss_like_popup: true }),
    });
    setLikeDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">불러오는 중...</div>;
  }

  if (!activity) {
    return <div className="p-8 text-center text-text-muted">활동을 찾을 수 없습니다.</div>;
  }

  if (activity.category === "job") {
    return (
      <>
        <JobDetailView
          activity={activity}
          loading={loading}
          onBack={() => router.back()}
          onBookmark={handleBookmark}
          onApply={handleApply}
          onShare={handleShare}
        />
        <LikeCompleteDialog
          open={likeDialogOpen}
          onClose={() => setLikeDialogOpen(false)}
          onDismissForever={dismissLikePopup}
        />
      </>
    );
  }

  if (activity.category === "education" || activity.category === "hobby") {
    return (
      <>
        <LearningDetailView
          activity={activity}
          loading={loading}
          onBack={() => router.back()}
          onBookmark={handleBookmark}
          onApply={handleApply}
          onShare={handleShare}
        />
        <LikeCompleteDialog
          open={likeDialogOpen}
          onClose={() => setLikeDialogOpen(false)}
          onDismissForever={dismissLikePopup}
        />
      </>
    );
  }

  if (activity.category === "support") {
    return (
      <>
        <SupportDetailView
          activity={activity}
          loading={loading}
          onBack={() => router.back()}
          onBookmark={handleBookmark}
          onApply={handleApply}
          onShare={handleShare}
        />
        <LikeCompleteDialog
          open={likeDialogOpen}
          onClose={() => setLikeDialogOpen(false)}
          onDismissForever={dismissLikePopup}
        />
      </>
    );
  }

  const isExpired = activity.status === "expired";
  const attrs = activity.attributes as Record<string, string>;
  const applyPeriod =
    activity.apply_start && activity.apply_end
      ? `${format(parseISO(activity.apply_start), "M월 d일")} ~ ${format(parseISO(activity.apply_end), "M월 d일")}`
      : activity.apply_end
        ? `~ ${format(parseISO(activity.apply_end), "M월 d일")}`
        : "상시 접수";

  return (
    <div className="bg-[#f8f9fc] pb-[var(--activity-action-bar-height)]">
      <header className="flex items-center gap-3 bg-white px-5 py-4">
        <button type="button" onClick={() => router.back()} className="text-xl" aria-label="뒤로">
          ‹
        </button>
        <h1 className="flex-1 truncate text-lg font-bold text-[#111318]">{activity.title}</h1>
        <button type="button" aria-label="공유" onClick={handleShare}>
          <Image src={ASSETS.iconShare} alt="" width={22} height={22} />
        </button>
      </header>

      <div className="px-5 py-4">
        {/* 상단 대표 이미지 (Figma 350×210) */}
        <ImagePlaceholder label="대표 이미지" aspect="banner" className="mb-4 w-full" />

        {/* 메인 카드 */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="h-2 bg-primary" />
          <div className="p-4">
            <span className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              {CATEGORY_LABELS[activity.category]}
            </span>
            <h2 className="mt-3 text-xl font-bold text-[#111318]">{activity.title}</h2>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-[#9aa0a8]">신청 기간</p>
                <p className="mt-1 text-base font-bold text-[#111318]">{applyPeriod}</p>
              </div>
              <DeadlineBadge applyEnd={activity.apply_end} />
            </div>
          </div>
        </div>

        {/* 채용 요강 / 상세 속성 */}
        <SectionCard icon="📋" title="활동 정보">
          {Object.keys(attrs).length > 0 ? (
            Object.entries(attrs).map(([k, v]) => <DetailRow key={k} label={k} value={String(v)} />)
          ) : (
            <>
              <DetailRow label="기관" value={activity.org_name} />
              {activity.region_district && (
                <DetailRow label="위치" value={`📍 서울 ${activity.region_district}`} />
              )}
            </>
          )}
        </SectionCard>

        {/* 업무/활동 내용 */}
        <SectionCard icon="💼" title="업무 내용">
          <p className="text-base leading-relaxed text-[#333640]">
            {resolveDetailSummary(activity)}
          </p>
        </SectionCard>

        <AiSummarySection activity={activity} />

        {/* 태그 영역 - 이미지 없을 때 placeholder */}
        <div className="mb-4 flex flex-wrap gap-2">
          {["단기 가능", "경력 무관"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-bold text-[#8a8f99]"
            >
              ♡ {tag}
            </span>
          ))}
        </div>

        {/* 기관 이미지 (Figma placeholder 영역) */}
        <ImagePlaceholder label="기관 이미지" aspect="wide" className="mb-4 w-full" />
      </div>

      {/* 하단 액션 바 */}
      <div className="activity-action-bar fixed left-1/2 z-30 flex w-full max-w-[390px] -translate-x-1/2 gap-3 border-t border-[#eceef2] bg-white p-4">
        <button
          type="button"
          disabled={loading}
          onClick={handleBookmark}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-2xl ${
            activity.bookmarked ? "border-primary text-red-500" : "border-gray-200"
          }`}
          aria-label="찜하기"
        >
          {activity.bookmarked ? "♥" : "♡"}
        </button>
        <button
          type="button"
          disabled={isExpired || activity.applied}
          onClick={handleApply}
          className="flex flex-1 items-center justify-center rounded-2xl bg-primary py-4 text-lg font-bold text-white disabled:bg-gray-300"
        >
          {activity.applied ? "신청완료" : isExpired ? "마감됨" : "지원하러 가기"}
        </button>
      </div>

      <LikeCompleteDialog
        open={likeDialogOpen}
        onClose={() => setLikeDialogOpen(false)}
        onDismissForever={dismissLikePopup}
      />
    </div>
  );
}
