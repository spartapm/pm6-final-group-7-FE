import type { QueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { CalendarItem } from "@/lib/calendar-utils";
import type { Activity, MeResponse } from "@/lib/types";

type ApplicationSnapshots = {
  activity: Activity | undefined;
  calendar: { items: CalendarItem[] } | undefined;
  me: MeResponse | undefined;
};

function captureSnapshots(
  queryClient: QueryClient,
  activityId: string
): ApplicationSnapshots {
  return {
    activity: queryClient.getQueryData<Activity>(["activity", activityId]),
    calendar: queryClient.getQueryData<{ items: CalendarItem[] }>(["calendar"]),
    me: queryClient.getQueryData<MeResponse>(["me"]),
  };
}

function rollbackSnapshots(
  queryClient: QueryClient,
  activityId: string,
  snapshots: ApplicationSnapshots
) {
  queryClient.setQueryData(["activity", activityId], snapshots.activity);
  queryClient.setQueryData(["calendar"], snapshots.calendar);
  queryClient.setQueryData(["me"], snapshots.me);
}

export function patchActivityApplied(
  queryClient: QueryClient,
  activityId: string,
  applied: boolean
) {
  queryClient.setQueryData<Activity>(["activity", activityId], (old) =>
    old ? { ...old, applied } : old
  );

  queryClient.setQueriesData<{ items: Activity[] }>({ queryKey: ["activities"] }, (old) => {
    if (!old?.items) return old;
    return {
      ...old,
      items: old.items.map((a) => (a.id === activityId ? { ...a, applied } : a)),
    };
  });

  queryClient.setQueryData<{ items: CalendarItem[] }>(["calendar"], (old) => {
    if (!old?.items) return old;
    return {
      ...old,
      items: old.items.map((item) =>
        item.activity.id === activityId ? { ...item, applied } : item
      ),
    };
  });

  if (applied) {
    queryClient.setQueryData<MeResponse>(["me"], (old) =>
      old ? { ...old, pending_apply_activity_id: null } : old
    );
  }
}

/** 캐시를 먼저 갱신한 뒤 서버에 반영합니다. 실패 시 롤백합니다. */
export async function setApplicationOptimistic(
  queryClient: QueryClient,
  activityId: string,
  applied: boolean,
  options?: { skipOptimistic?: boolean }
) {
  const snapshots = captureSnapshots(queryClient, activityId);

  if (!options?.skipOptimistic) {
    patchActivityApplied(queryClient, activityId, applied);
  }

  try {
    await apiFetch(`/activities/${activityId}/application`, {
      method: "PATCH",
      body: JSON.stringify({ applied }),
    });
  } catch (error) {
    rollbackSnapshots(queryClient, activityId, snapshots);
    throw error;
  }

  void queryClient.invalidateQueries({ queryKey: ["calendar"] });
  void queryClient.invalidateQueries({ queryKey: ["activity", activityId] });
  void queryClient.invalidateQueries({ queryKey: ["me"] });
  void queryClient.invalidateQueries({ queryKey: ["activities"] });
}

/** UI를 즉시 갱신한 뒤 백그라운드에서 서버에 저장합니다. */
export function applyApplicationOptimistic(
  queryClient: QueryClient,
  activityId: string,
  applied: boolean
) {
  patchActivityApplied(queryClient, activityId, applied);
  return setApplicationOptimistic(queryClient, activityId, applied, { skipOptimistic: true });
}
