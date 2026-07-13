"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApplyConfirmDialog } from "@/components/activity/ApplyConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api-client";
import {
  applyApplicationOptimistic,
  patchActivityApplied,
} from "@/lib/optimistic-application";
import type { MeResponse } from "@/lib/types";

/** 홈 재진입 시 신청확인 대기 팝업 (SCR-012 / APP-001) */
export function PendingApplyHandler() {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    const pendingId = me?.pending_apply_activity_id;
    if (!pendingId) return;

    const cachedActivity = queryClient.getQueryData<{ applied?: boolean }>(["activity", pendingId]);
    if (cachedActivity?.applied) {
      queryClient.setQueryData<MeResponse>(["me"], (old) =>
        old ? { ...old, pending_apply_activity_id: null } : old
      );
      return;
    }

    setActivityId(pendingId);
    setOpen(true);
  }, [me?.pending_apply_activity_id, queryClient]);

  function handleConfirm() {
    if (!activityId) return;
    const id = activityId;
    setOpen(false);
    setActivityId(null);
    patchActivityApplied(queryClient, id, true);

    void applyApplicationOptimistic(queryClient, id, true)
      .then(() => {
        // AP-06: 신청완료 안내 토스트
        showToast("신청완료한 목록은 내 캘린더에서 확인할 수 있어요");
      })
      .catch(() => {
        showToast("신청 완료 상태를 저장하지 못했어요. 다시 시도해주세요.");
        setActivityId(id);
        setOpen(true);
      });
  }

  function handleCancel() {
    const id = activityId;
    setOpen(false);
    setActivityId(null);
    // 서버의 대기 레코드를 제거해 재진입 시 팝업이 반복되지 않도록 함 (AP-03)
    queryClient.setQueryData<MeResponse>(["me"], (old) =>
      old ? { ...old, pending_apply_activity_id: null } : old
    );
    if (id) {
      void apiFetch(`/activities/${id}/dismiss-pending`, { method: "POST" }).catch(() => {});
    }
  }

  return (
    <ApplyConfirmDialog open={open} onConfirm={handleConfirm} onCancel={handleCancel} />
  );
}
