"use client";

/** 비회원: 지원하러 가기 후 ‘신청을 완료하셨나요?’ 확인 대기 */

const PENDING_KEY = "oyukirang-guest-pending-apply";
export const GUEST_PENDING_APPLY_EVENT = "ov-guest-pending-apply";

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GUEST_PENDING_APPLY_EVENT));
}

export function getGuestPendingApplyId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_KEY);
}

export function setGuestPendingApplyId(activityId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_KEY, activityId);
  emit();
}

export function clearGuestPendingApplyId() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_KEY);
  emit();
}
