"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApplyConfirmDialog } from "@/components/activity/ApplyConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api-client";
import {
  applyApplicationOptimistic,
  patchActivityApplied,
} from "@/lib/optimistic-application";
import {
  GUEST_PENDING_APPLY_EVENT,
  clearGuestPendingApplyId,
  getGuestPendingApplyId,
} from "@/lib/guest-pending-apply";
import type { MeResponse } from "@/lib/types";
import { useAuthAction } from "@/providers/AuthActionProvider";

/** 홈 재진입 시 신청확인 대기 팝업 (SCR-012 / APP-001) — 비회원 포함 */
export function PendingApplyHandler() {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const { requireAuth } = useAuthAction();
  const [open, setOpen] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    retry: false,
  });

  const syncPendingDialog = useCallback(() => {
    const meData = queryClient.getQueryData<MeResponse>(["me"]);
    const serverPending = meData?.pending_apply_activity_id ?? null;
    const guestPending = getGuestPendingApplyId();
    const pendingId = serverPending || guestPending;
    if (!pendingId) {
      setOpen(false);
      setActivityId(null);
      return;
    }

    const cachedActivity = queryClient.getQueryData<{ applied?: boolean }>(["activity", pendingId]);
    if (cachedActivity?.applied) {
      if (serverPending) {
        queryClient.setQueryData<MeResponse>(["me"], (old) =>
          old ? { ...old, pending_apply_activity_id: null } : old
        );
      }
      clearGuestPendingApplyId();
      setOpen(false);
      setActivityId(null);
      return;
    }

    setActivityId(pendingId);
    setOpen(true);
  }, [queryClient]);

  useEffect(() => {
    syncPendingDialog();
  }, [syncPendingDialog, me?.pending_apply_activity_id]);

  useEffect(() => {
    const onGuestPending = () => syncPendingDialog();
    const refreshThenSync = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        await queryClient.refetchQueries({ queryKey: ["me"] });
      } catch {
        // 비로그인 등 — guest pending만으로 sync
      }
      syncPendingDialog();
    };
    window.addEventListener(GUEST_PENDING_APPLY_EVENT, onGuestPending);
    window.addEventListener("focus", refreshThenSync);
    document.addEventListener("visibilitychange", refreshThenSync);
    return () => {
      window.removeEventListener(GUEST_PENDING_APPLY_EVENT, onGuestPending);
      window.removeEventListener("focus", refreshThenSync);
      document.removeEventListener("visibilitychange", refreshThenSync);
    };
  }, [syncPendingDialog, queryClient]);

  function handleConfirm() {
    if (!activityId) return;
    const id = activityId;
    setOpen(false);
    setActivityId(null);
    clearGuestPendingApplyId();

    void requireAuth(
      async () => {
        patchActivityApplied(queryClient, id, true);
        try {
          await applyApplicationOptimistic(queryClient, id, true);
          showToast("신청완료한 목록은 내 캘린더에서 확인할 수 있어요");
        } catch {
          showToast("신청 완료 상태를 저장하지 못했어요. 다시 시도해주세요.");
          setActivityId(id);
          setOpen(true);
        }
      },
      {
        reason: "applySave",
        returnTo: `/activities/${id}`,
        intent: { type: "applySave", activityId: id },
      }
    );
  }

  function handleCancel() {
    const id = activityId;
    setOpen(false);
    setActivityId(null);
    clearGuestPendingApplyId();
    queryClient.setQueryData<MeResponse>(["me"], (old) =>
      old ? { ...old, pending_apply_activity_id: null } : old
    );
    if (id && me?.pending_apply_activity_id === id) {
      void apiFetch(`/activities/${id}/dismiss-pending`, { method: "POST" }).catch(() => {});
    }
  }

  return (
    <ApplyConfirmDialog open={open} onConfirm={handleConfirm} onCancel={handleCancel} />
  );
}
