import { apiFetch } from "@/lib/api-client";

const MAX_CONCURRENT = 2;
let active = 0;
const waitQueue: Array<() => void> = [];
const inflight = new Map<string, Promise<string>>();

// 세션 동안 유지되는 요약 결과 캐시. 한 번 불러온 요약은 화면/탭 전환으로
// 컴포넌트가 리마운트돼도 재요청 없이 즉시 재사용된다.
const resultCache = new Map<string, string>();

export function getCachedSummary(activityId: string): string | undefined {
  return resultCache.get(activityId);
}

export function setCachedSummary(activityId: string, summary: string): void {
  resultCache.set(activityId, summary);
}

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waitQueue.push(resolve));
}

function release() {
  active--;
  const next = waitQueue.shift();
  if (next) {
    active++;
    next();
  }
}

export async function requestActivitySummary(
  activityId: string,
  options?: { force?: boolean }
): Promise<string> {
  const key = options?.force ? `${activityId}:force` : activityId;
  const existing = inflight.get(key);
  if (existing) return existing;

  const task = (async () => {
    await acquire();
    try {
      const qs = options?.force ? "?force=true" : "";
      const res = await apiFetch<{ ai_summary: string }>(
        `/activities/${activityId}/summarize${qs}`,
        { method: "POST" }
      );
      resultCache.set(activityId, res.ai_summary);
      return res.ai_summary;
    } finally {
      release();
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}
