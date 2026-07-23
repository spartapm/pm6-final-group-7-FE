"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DeadlineBadge } from "@/components/ui/DeadlineBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LikeCompleteDialog } from "@/components/activity/LikeCompleteDialog";
import { BookmarkActionButton } from "@/components/activity/BookmarkActionButton";
import { JobDetailView } from "@/components/activity/JobDetailView";
import { LearningDetailView } from "@/components/activity/LearningDetailView";
import { SupportDetailView } from "@/components/activity/SupportDetailView";
import { apiFetch } from "@/lib/api-client";
import { setApplicationOptimistic } from "@/lib/optimistic-application";
import { setGuestPendingApplyId } from "@/lib/guest-pending-apply";
import { getApplySiteName, openApplyUrl, resolveApplyUrl } from "@/lib/apply-url";
import { markViewed } from "@/lib/viewed";
import { CATEGORY_LABELS } from "@/lib/onboarding";
import type { Activity, MeResponse } from "@/lib/types";
import { formatActivityRegion } from "@/lib/region-display";
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
  const [cancelApplyOpen, setCancelApplyOpen] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => apiFetch<Activity>(`/activities/${id}`),
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    retry: false,
  });

  // 확인함 표시 — 상세 진입 시 기록
  useEffect(() => {
    if (activity?.id) markViewed(activity.id);
  }, [activity?.id]);

  async function handleBookmark() {
    await requireAuth(
      async () => {
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
      },
      {
        reason: "bookmark",
        returnTo: `/activities/${id}`,
        intent: { type: "bookmark", activityId: id },
      }
    );
  }

  async function doOpenApply() {
    // 게스트도 외부 신청 URL은 열 수 있음 — 클릭 로그·pending은 로그인 시에만
    let loggedIn = false;
    try {
      await apiFetch(`/activities/${id}/apply-click`, { method: "POST" });
      loggedIn = true;
    } catch {
      // 비로그인 401 무시
    }
    const result = await openApplyUrl(activity!);
    if (!result.opened) {
      showToast("신청 링크가 없습니다. 담당 기관에 문의해 주세요.");
      return;
    }
    if (result.copiedTitle) {
      showToast("공고 제목이 복사되었습니다. 검색창에 붙여넣어 검색해보세요!");
    }
    if (loggedIn) {
      // 서버 pending을 me 캐시에 반영 — 탭 복귀 시 ‘신청을 완료하셨나요?’ 노출
      queryClient.setQueryData<MeResponse>(["me"], (old) =>
        old ? { ...old, pending_apply_activity_id: id } : old
      );
    } else {
      // 비회원: 신청완료 저장 유도(확인 팝업 → 로그인)
      setGuestPendingApplyId(id);
    }
  }

  async function handleApply() {
    // 이미 신청완료 상태면 재클릭 시 취소 — 로그인 필요
    if (activity?.applied) {
      await requireAuth(
        async () => {
          setCancelApplyOpen(true);
        },
        {
          reason: "applySave",
          returnTo: `/activities/${id}`,
          intent: { type: "applyCancel", activityId: id },
        }
      );
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showToast("인터넷 연결을 확인해주세요.");
      return;
    }

    // 외부 홈페이지로 이동 전 확인 팝업 (게스트도 가능)
    const url = activity ? resolveApplyUrl(activity) : null;
    if (url && /^https?:\/\//i.test(url)) {
      setApplyConfirmOpen(true);
      return;
    }
    await doOpenApply();
  }

  async function confirmOpenApply() {
    setApplyConfirmOpen(false);
    await doOpenApply();
  }

  async function confirmCancelApply() {
    setCancelApplyOpen(false);
    await requireAuth(
      async () => {
        try {
          await setApplicationOptimistic(queryClient, id, false);
          showToast("신청완료를 취소했어요.");
        } catch {
          showToast("취소 처리에 실패했어요. 다시 시도해주세요.");
        }
      },
      {
        reason: "applySave",
        returnTo: `/activities/${id}`,
        intent: { type: "applyCancel", activityId: id },
      }
    );
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

  const cancelApplyModal = (
    <>
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
        open={applyConfirmOpen}
        title={activity ? getApplySiteName(activity) : ""}
        description="홈페이지로 이동합니다."
        confirmLabel="이동하기"
        cancelLabel="취소"
        onConfirm={confirmOpenApply}
        onCancel={() => setApplyConfirmOpen(false)}
      />
    </>
  );

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
        {cancelApplyModal}
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
        {cancelApplyModal}
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
        {cancelApplyModal}
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
        <button type="button" aria-label="공유" onClick={handleShare} className="p-2">
          <Image src={ASSETS.iconShare} alt="" width={20} height={20} />
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
                <DetailRow
                  label="위치"
                  value={`📍 ${formatActivityRegion(activity) ?? activity.region_district}`}
                />
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
        <BookmarkActionButton
          bookmarked={Boolean(activity.bookmarked)}
          disabled={loading}
          onClick={handleBookmark}
        />
        <button
          type="button"
          disabled={isExpired}
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
      {cancelApplyModal}
    </div>
  );
}
