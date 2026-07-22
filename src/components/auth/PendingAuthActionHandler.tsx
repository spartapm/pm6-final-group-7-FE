"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  clearPendingAuthAction,
  getPendingAuthAction,
  type PendingAuthAction,
} from "@/lib/pending-auth-action";
import { clearGuestPendingApplyId } from "@/lib/guest-pending-apply";
import {
  applyApplicationOptimistic,
  patchActivityApplied,
} from "@/lib/optimistic-application";
import { setOnboardingFlow } from "@/lib/onboarding";
import type { MeResponse, RecommendationItem } from "@/lib/types";
import { useAuthAction } from "@/providers/AuthActionProvider";

/**
 * 로그인 복귀 후 pending auth action 을 한 번 실행한다.
 * (찜하기 / 새로고침 / 신청완료 저장·취소 / 마이 메뉴 이동 등)
 */
export function PendingAuthActionHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const { isAuthenticated } = useAuthAction();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    const action = getPendingAuthAction();
    if (!action) return;

    let cancelled = false;

    void (async () => {
      if (!(await isAuthenticated())) return;
      if (cancelled) return;
      ranRef.current = true;
      clearPendingAuthAction();

      try {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        await resumeAction(action, {
          queryClient,
          router,
          showToast,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          showToast("로그인 세션이 만료되었어요. 다시 로그인해 주세요.");
          return;
        }
        showToast("요청을 이어가지 못했어요. 다시 시도해 주세요.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, queryClient, router, showToast]);

  return null;
}

async function resumeAction(
  action: PendingAuthAction,
  ctx: {
    queryClient: ReturnType<typeof useQueryClient>;
    router: ReturnType<typeof useRouter>;
    showToast: (msg: string) => void;
  }
) {
  const { queryClient, router, showToast } = ctx;

  switch (action.type) {
    case "bookmark": {
      const res = await apiFetch<{ bookmarked: boolean }>(
        `/activities/${action.activityId}/bookmark`,
        { method: "POST" }
      );
      await queryClient.invalidateQueries({ queryKey: ["activity", action.activityId] });
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      const me = queryClient.getQueryData<MeResponse>(["me"]);
      // 로그인 직후 me 캐시가 비어 있을 수 있음 — 있으면 정책 반영
      if (res.bookmarked && me?.preferences?.dismiss_like_popup) {
        showToast("찜 목록에 추가했어요");
      } else if (res.bookmarked) {
        showToast("찜 목록에 추가했어요");
      } else {
        showToast("찜을 해제했어요");
      }
      return;
    }
    case "refresh": {
      const result = await apiFetch<{ items: RecommendationItem[] }>("/recommendations/refresh", {
        method: "POST",
        body: JSON.stringify({ exclude_ids: [] }),
      });
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      if (result.items.length === 0) {
        showToast("지금 볼 수 있는 추천을 모두 확인했어요.");
      }
      router.replace("/home");
      return;
    }
    case "applySave": {
      clearGuestPendingApplyId();
      patchActivityApplied(queryClient, action.activityId, true);
      await applyApplicationOptimistic(queryClient, action.activityId, true);
      showToast("신청완료한 목록은 내 캘린더에서 확인할 수 있어요");
      return;
    }
    case "applyCancel": {
      patchActivityApplied(queryClient, action.activityId, false);
      await applyApplicationOptimistic(queryClient, action.activityId, false);
      showToast("신청완료를 취소했어요.");
      return;
    }
    case "personalize": {
      setOnboardingFlow("settings");
      router.replace("/onboarding/region");
      return;
    }
    case "navigate": {
      router.replace(action.path);
      return;
    }
    default:
      return;
  }
}
