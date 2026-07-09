export function getCustomerCenterUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CUSTOMER_CENTER_URL?.trim();
  return url || null;
}

/** URL이 설정된 경우에만 새 창을 열고, 없으면 false 반환 */
export function openCustomerCenter(): boolean {
  const url = getCustomerCenterUrl();
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
