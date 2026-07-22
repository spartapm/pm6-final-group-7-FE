"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/AppHeader";
import { RecommendationCard } from "@/components/activity/ActivityCards";
import { EmptyState } from "@/components/ui/EmptyState";
import { SchedulePreviewCard } from "@/components/home/SchedulePreviewCard";
import { PromoBanner } from "@/components/home/PromoBanner";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiFetch } from "@/lib/api-client";
import { ASSETS } from "@/lib/assets";
import {
  getGuestOnboarding,
  isGuestOnboardingComplete,
  normalizeGuestOnboarding,
} from "@/lib/guest-onboarding";
import { getOnboardingPath } from "@/lib/onboarding";
import type { MeResponse, RecommendationItem, UserOnboarding } from "@/lib/types";
import { getUpcomingAppliedItems, type CalendarItem } from "@/lib/calendar-utils";
import { getViewedIds } from "@/lib/viewed";
import { getCityByCode } from "@/lib/regions";
import { useAuthAction } from "@/providers/AuthActionProvider";

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const { requireAuth } = useAuthAction();
  const [refreshing, setRefreshing] = useState(false);
  const seenRecIds = useRef<Set<string>>(new Set());
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  // SSR/CSR: 마운트 후 localStorage에서 게스트 온보딩 로드
  const [guestOb, setGuestOb] = useState<Partial<UserOnboarding> | null>(null);
  const [guestReady, setGuestReady] = useState(false);

  const syncViewed = useCallback(() => setViewedIds(new Set(getViewedIds())), []);

  useEffect(() => {
    const loaded = getGuestOnboarding();
    setGuestOb(loaded);
    setGuestReady(true);
    syncViewed();
    window.addEventListener("ov-viewed-changed", syncViewed);
    window.addEventListener("focus", syncViewed);
    return () => {
      window.removeEventListener("ov-viewed-changed", syncViewed);
      window.removeEventListener("focus", syncViewed);
    };
  }, [syncViewed]);

  const {
    data: me,
    isLoading: meLoading,
    isError: meError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    retry: false,
  });

  const authReady = !meLoading;
  // /me 로딩 중에도 로그인으로 보지 않음 — authReady 깜빡임으로 guestComplete/showRecs가 꺼지지 않게 함
  const isLoggedIn = authReady && !meError && Boolean(me);
  const isGuest = !isLoggedIn;
  const guestComplete = isGuest && isGuestOnboardingComplete(guestOb);
  const guestNormalized = useMemo(
    () => (guestComplete ? normalizeGuestOnboarding(guestOb) : null),
    [guestComplete, guestOb]
  );

  const serverComplete = Boolean(me?.onboarding?.onboarding_completed_at);
  const onboarding = me?.onboarding ?? guestNormalized;
  // 게스트 온보딩 완료면 /me 대기 없이 맞춤 추천 표시
  const showRecs = guestComplete || serverComplete || (authReady && isGuest);

  const recMode = isLoggedIn ? "user" : guestComplete ? "guest-preview" : "guest";
  const guestRecKey = guestComplete
    ? `${guestOb?.region_city ?? ""}|${guestOb?.region_district ?? ""}|${(guestOb?.interest_directions ?? []).join(",")}`
    : "";

  const recsEnabled =
    guestReady && (guestComplete || (authReady && (serverComplete || isGuest)));

  const {
    data: recs,
    isFetching: recsFetching,
    isError: recsError,
    refetch: refetchRecs,
  } = useQuery({
    queryKey: ["recommendations", recMode, guestRecKey],
    queryFn: async () => {
      if (recMode === "guest-preview" && guestOb) {
        try {
          return await apiFetch<{ items: RecommendationItem[] }>("/recommendations/preview", {
            method: "POST",
            body: JSON.stringify({ onboarding: guestOb }),
          });
        } catch {
          // preview 실패 시 기본 추천으로 폴백
          return apiFetch<{ items: RecommendationItem[] }>("/recommendations/home");
        }
      }
      return apiFetch<{ items: RecommendationItem[] }>("/recommendations/home");
    },
    // 게스트 온보딩 완료면 /me 완료 전에도 preview 요청
    enabled: recsEnabled,
    retry: 1,
  });

  const recsLoading = recsEnabled && recsFetching && !recs;

  const { data: calendar } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => apiFetch<{ items: CalendarItem[] }>("/calendar"),
    enabled: !isGuest && serverComplete,
    retry: false,
  });

  const demoRefreshing = useRef(false);

  useEffect(() => {
    if (isGuest || meLoading || !serverComplete || demoRefreshing.current) return;
    demoRefreshing.current = true;
    apiFetch("/notifications/refresh-demo", { method: "POST" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
      .catch(() => {})
      .finally(() => {
        demoRefreshing.current = false;
      });
  }, [isGuest, meLoading, serverComplete, queryClient]);

  useEffect(() => {
    if (recs?.items) {
      for (const r of recs.items) seenRecIds.current.add(r.activity.id);
    }
  }, [recs?.items]);

  async function handleRefresh() {
    await requireAuth(
      async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
          const exclude = Array.from(seenRecIds.current);
          const result = await apiFetch<{ items: RecommendationItem[] }>("/recommendations/refresh", {
            method: "POST",
            body: JSON.stringify({ exclude_ids: exclude }),
          });
          const freshIds = result.items
            .map((r) => r.activity.id)
            .filter((id) => !seenRecIds.current.has(id));
          if (result.items.length === 0 || freshIds.length === 0) {
            showToast("지금 볼 수 있는 추천을 모두 확인했어요.");
            seenRecIds.current = new Set(result.items.map((r) => r.activity.id));
          } else {
            for (const r of result.items) seenRecIds.current.add(r.activity.id);
          }
          await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 401)) {
            showToast("추천을 새로 불러오지 못했어요.");
          }
        } finally {
          setRefreshing(false);
        }
      },
      { reason: "refresh", returnTo: "/home", intent: { type: "refresh" } }
    );
  }

  const upcomingItems = calendar?.items ? getUpcomingAppliedItems(calendar.items) : [];
  const nickname = isGuest
    ? "오육이"
    : (me?.profile?.nickname?.replace(/님$/, "") ?? "오육이");
  const cityLabel = onboarding?.region_city
    ? getCityByCode(onboarding.region_city)?.label
    : null;

  // 로그인 유저만(서버 온보딩 미완료) 온보딩 CTA — 게스트·로딩 중에는 숨김
  const showOnboardingCta = authReady && !isGuest && !serverComplete;

  return (
    <div className="bg-[#f8f9fc] pb-4">
      <AppHeader
        nickname={nickname}
        district={onboarding?.region_district}
        cityLabel={cityLabel}
        isGuest={isGuest}
      />

      {upcomingItems.length > 0 ? (
        <SchedulePreviewCard
          items={upcomingItems.map((item) => ({
            activityId: item.activity.id,
            title: item.activity.title,
            category: item.activity.category,
            applyEnd: item.activity.apply_end,
            eventDate: item.activity.event_start,
            district: item.activity.region_district,
          }))}
        />
      ) : (
        (isGuest || (serverComplete && calendar)) && (
          <div className="mx-5 -mt-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-base font-extrabold text-text-primary">다가오는 내 일정</p>
            <p className="mt-2 text-sm text-text-muted">다가오는 일정이 아직 없어요.</p>
          </div>
        )
      )}

      <PromoBanner />

      <div className="mx-3 mb-4 mt-2 rounded-3xl bg-[#edeffb] px-4 py-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[18px] font-bold text-[#141414]">
            {guestComplete || serverComplete
              ? `${nickname}님의 맞춤 추천`
              : isGuest
                ? "추천 활동"
                : `${nickname}님의 맞춤 추천`}
          </h2>
          {showRecs && (
            <button
              type="button"
              disabled={refreshing}
              onClick={handleRefresh}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[14px] font-bold text-white shadow-sm disabled:opacity-60"
            >
              <Image
                src={ASSETS.iconRefresh}
                alt=""
                width={14}
                height={14}
                unoptimized
                className={`brightness-0 invert ${refreshing ? "animate-spin-slow" : ""}`}
              />
              새로고침
            </button>
          )}
        </div>
        <p className="mt-2.5 whitespace-nowrap text-[14px] text-text-muted">
          {guestComplete
            ? "설정하신 관심 영역과 지역 기반으로 추천해 드려요"
            : isGuest
              ? "로그인하면 맞춤 추천을 받을 수 있어요"
              : "회원님의 관심 영역과 지역 기반으로 추천해 드려요"}
        </p>

        {showOnboardingCta && (
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
        {showRecs && recsLoading && (
          <p className="mt-8 text-center text-text-muted">추천을 불러오는 중...</p>
        )}
        {showRecs && !recsLoading && recsError && !recs?.items?.length && (
          <EmptyState
            title="추천을 불러오지 못했어요."
            description="잠시 후 다시 시도해주세요."
            actionLabel="다시 시도"
            onAction={() => void refetchRecs()}
          />
        )}
        {showRecs && !recsLoading && !recsError && (!recs?.items || recs.items.length === 0) && (
          <EmptyState
            title="아직 딱 맞는 추천이 없어요."
            description="관심 설정을 넓혀보세요."
            actionLabel="설정하기"
            onAction={() => router.push("/my")}
          />
        )}
        {showRecs && !recsLoading && (
          <div className="mt-4">
            {(["job", "education", "hobby"] as const).map((cat) => {
              const items = (recs?.items ?? []).filter((r) => r.activity.category === cat);
              if (items.length === 0) return null;
              const meta =
                cat === "job"
                  ? { label: "채용", color: "text-category-job", badge: "bg-category-job" }
                  : cat === "education"
                    ? { label: "교육", color: "text-category-education", badge: "bg-category-education" }
                    : { label: "취미", color: "text-category-hobby", badge: "bg-category-hobby" };
              return (
                <section key={cat} className="mb-5">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <span className={`text-[18px] font-bold ${meta.color}`}>{meta.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[12px] font-bold text-white ${meta.badge}`}
                    >
                      {items.length}건
                    </span>
                  </div>
                  {items.map((item) => (
                    <RecommendationCard
                      key={item.activity.id}
                      activity={item.activity}
                      reasons={item.reasons}
                      onboarding={onboarding ?? undefined}
                      viewed={viewedIds.has(item.activity.id)}
                    />
                  ))}
                </section>
              );
            })}
            {(recs?.items ?? [])
              .filter((r) => !["job", "education", "hobby"].includes(r.activity.category))
              .map((item) => (
                <RecommendationCard
                  key={item.activity.id}
                  activity={item.activity}
                  reasons={item.reasons}
                  onboarding={onboarding ?? undefined}
                  viewed={viewedIds.has(item.activity.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
