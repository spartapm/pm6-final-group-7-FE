"use client";

/**
 * 비로그인 → 로그인 유도 후 이어서 실행할 동작.
 * sessionStorage에 직렬화해 OAuth/이메일 로그인 복귀에도 유지한다.
 */

const KEY = "oyukirang-pending-auth-action";

export type PendingAuthAction =
  | { type: "bookmark"; activityId: string }
  | { type: "refresh" }
  | { type: "applySave"; activityId: string }
  | { type: "applyCancel"; activityId: string }
  | { type: "personalize" }
  | { type: "navigate"; path: string };

export function getPendingAuthAction(): PendingAuthAction | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingAuthAction;
  } catch {
    return null;
  }
}

export function setPendingAuthAction(action: PendingAuthAction) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(action));
}

export function clearPendingAuthAction() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
