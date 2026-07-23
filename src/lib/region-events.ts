/** 지역 변경 후 홈·탭 목록 등이 즉시 새 기준으로 갱신되도록 알림 */
export const REGION_CHANGED_EVENT = "ov-region-changed";

export function notifyRegionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REGION_CHANGED_EVENT));
}
