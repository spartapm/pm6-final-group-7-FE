/** 오육이랑 카카오톡 오픈채팅 — env로 덮어쓸 수 있음 */
const DEFAULT_CUSTOMER_CENTER_URL = "https://open.kakao.com/o/s4bQx9Bi";

export function getCustomerCenterUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CUSTOMER_CENTER_URL?.trim();
  return url || DEFAULT_CUSTOMER_CENTER_URL;
}

/** 고객센터(오픈채팅)를 새 창으로 연다 */
export function openCustomerCenter(): boolean {
  const url = getCustomerCenterUrl();
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
