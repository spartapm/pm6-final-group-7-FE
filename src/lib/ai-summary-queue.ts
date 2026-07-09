import { apiFetch } from "@/lib/api-client";

const MAX_CONCURRENT = 2;
let active = 0;
const waitQueue: Array<() => void> = [];
const inflight = new Map<string, Promise<string>>();

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
      return res.ai_summary;
    } finally {
      release();
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}
