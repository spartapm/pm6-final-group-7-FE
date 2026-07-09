"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/AppHeader";
import { RecommendationCard } from "@/components/activity/ActivityCards";
import { EmptyState } from "@/components/ui/EmptyState";
import { SchedulePreviewCard } from "@/components/home/SchedulePreviewCard";
import { PromoBanner } from "@/components/home/PromoBanner";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api-client";
import { getOnboardingPath } from "@/lib/onboarding";
import type { MeResponse, RecommendationItem } from "@/lib/types";
import { getNearestUpcomingItem, type CalendarItem } from "@/lib/calendar-utils";

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const previousRecIds = useRef<string[]>([]);

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  const onboardingComplete = Boolean(me?.onboarding?.onboarding_completed_at);

  const { data: recs, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => apiFetch<{ items: RecommendationItem[] }>("/recommendations/home"),
    enabled: onboardingComplete,
  });

  const { data: calendar } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => apiFetch<{ items: CalendarItem[] }>("/calendar"),
  });

  const demoRefreshing = useRef(false);

  useEffect(() => {
    if (meLoading || !onboardingComplete || demoRefreshing.current) return;
    demoRefreshing.current = true;
    apiFetch("/notifications/refresh-demo", { method: "POST" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
      .catch(() => {})
      .finally(() => {
        demoRefreshing.current = false;
      });
  }, [meLoading, onboardingComplete, queryClient]);

  useEffect(() => {
    if (recs?.items) {
      previousRecIds.current = recs.items.map((r) => r.activity.id);
    }
  }, [recs?.items]);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const exclude = recs?.items.map((r) => r.activity.id) ?? [];
      const result = await apiFetch<{ items: RecommendationItem[] }>("/recommendations/refresh", {
        method: "POST",
        body: JSON.stringify({ exclude_ids: exclude }),
      });
      const newIds = result.items.map((r) => r.activity.id).sort().join(",");
      const oldIds = exclude.sort().join(",");
      if (newIds === oldIds || result.items.length === 0) {
        showToast("지금 볼 수 있는 추천을 모두 확인했어요.");
      }
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    } catch {
      showToast("추천을 새로 불러오지 못했어요.");
    } finally {
      setRefreshing(false);
    }
  }

  const upcoming = calendar?.items ? getNearestUpcomingItem(calendar.items) : null;
  const nickname = me?.profile?.nickname?.replace(/님$/, "") ?? "회원";

  return (
    <div className="bg-[#f8f9fc] pb-4">
      <AppHeader nickname={nickname} district={me?.onboarding?.region_district} />

      {upcoming?.activity ? (
        <SchedulePreviewCard
          title={upcoming.activity.title}
          category={upcoming.activity.category}
          applyEnd={upcoming.activity.apply_end}
          eventDate={upcoming.activity.event_start}
          district={upcoming.activity.region_district}
          activityId={upcoming.activity.id}
        />
      ) : (
        onboardingComplete &&
        calendar &&
        calendar.items.length === 0 && (
          <div className="mx-5 -mt-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-base font-extrabold text-text-primary">다가오는 내 일정</p>
            <p className="mt-2 text-sm text-text-muted">다가오는 일정이 아직 없어요.</p>
          </div>
        )
      )}

      <PromoBanner />

      <div className="px-5 py-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[22px] font-extrabold text-text-primary">
              {nickname}님의 맞춤 추천
            </h2>
            <p className="mt-1 text-base text-text-muted">
              회원님의 관심 영역과 지역 기반으로 추천해 드려요
            </p>
          </div>
          {onboardingComplete && (
            <button
              type="button"
              disabled={refreshing}
              onClick={handleRefresh}
              className={`shrink-0 pt-1 text-[13.5px] text-text-muted ${refreshing ? "animate-spin-slow" : ""}`}
            >
              ↻ 새로고침
            </button>
          )}
        </div>

        {!onboardingComplete && (
          <EmptyState
            title="맞춤 추천을 받으려면 온보딩이 필요해요"
            description="관심사와 지역을 알려주시면 회원님께 맞는 활동을 추천해 드려요."
            actionLabel={
              me?.onboarding?.onboarding_step && me.onboarding.onboarding_step !== "region"
                ? "온보딩 이어하기"
                : "온보딩 시작하기"
            }
            onAction={() =>
              router.push(getOnboardingPath(me?.onboarding?.onboarding_step ?? "region"))
            }
          />
        )}
        {onboardingComplete && isLoading && (
          <p className="mt-8 text-center text-text-muted">추천을 불러오는 중...</p>
        )}
        {onboardingComplete && !isLoading && (!recs?.items || recs.items.length === 0) && (
          <EmptyState
            title="아직 딱 맞는 추천이 없어요."
            description="관심 설정을 넓혀보세요."
            actionLabel="설정하기"
            onAction={() => router.push("/my")}
          />
        )}
        {onboardingComplete && (
          <div className="mt-4">
            {recs?.items?.map((item) => (
              <RecommendationCard
                key={item.activity.id}
                activity={item.activity}
                reasons={item.reasons}
                onboarding={me?.onboarding}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
