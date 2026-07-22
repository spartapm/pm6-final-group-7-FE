"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LikeCompleteDialog } from "@/components/activity/LikeCompleteDialog";
import { useAuthAction } from "@/providers/AuthActionProvider";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { MeResponse } from "@/lib/types";

export function useActivityActions() {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const { requireAuth, promptLogin } = useAuthAction();
  const [likeDialogOpen, setLikeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dismissLikePopup = useCallback(async () => {
    await apiFetch("/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({ dismiss_like_popup: true }),
    });
    setLikeDialogOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [queryClient]);

  const toggleBookmark = useCallback(
    async (activityId: string) => {
      await requireAuth(
        async () => {
          setLoading(true);
          try {
            const res = await apiFetch<{ bookmarked: boolean }>(
              `/activities/${activityId}/bookmark`,
              { method: "POST" }
            );
            await queryClient.invalidateQueries({ queryKey: ["activity", activityId] });
            await queryClient.invalidateQueries({ queryKey: ["activities"] });
            await queryClient.invalidateQueries({ queryKey: ["calendar"] });

            const me = queryClient.getQueryData<MeResponse>(["me"]);
            if (res.bookmarked && !me?.preferences?.dismiss_like_popup) {
              setLikeDialogOpen(true);
            } else if (res.bookmarked) {
              showToast("찜 목록에 추가했어요");
            } else {
              showToast("찜을 해제했어요");
            }
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              promptLogin({
                reason: "bookmark",
                intent: { type: "bookmark", activityId },
              });
            } else {
              showToast("관심 활동을 저장하지 못했어요. 다시 시도해주세요.");
            }
          } finally {
            setLoading(false);
          }
        },
        { reason: "bookmark", intent: { type: "bookmark", activityId } }
      );
    },
    [requireAuth, promptLogin, queryClient, showToast]
  );

  const LikeDialog = (
    <LikeCompleteDialog
      open={likeDialogOpen}
      onClose={() => setLikeDialogOpen(false)}
      onDismissForever={dismissLikePopup}
    />
  );

  return { toggleBookmark, loading, LikeDialog };
}
