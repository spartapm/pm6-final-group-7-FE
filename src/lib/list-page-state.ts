/**
 * 목록 화면 필터·검색·페이지·스크롤 복원 (PM 1-5·3-1)
 */

export interface ListPageState<TFilters extends Record<string, string[]>> {
  category: string;
  filtersByCategory: Record<string, TFilters>;
  search: string;
  page: number;
  scrollY: number;
  regionCity?: string;
}

export function loadListPageState<TFilters extends Record<string, string[]>>(
  key: string
): ListPageState<TFilters> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ListPageState<TFilters>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveListPageState<TFilters extends Record<string, string[]>>(
  key: string,
  state: ListPageState<TFilters>
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function readScrollY(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

/** 레이아웃·데이터 로딩 직후에도 위치가 맞도록 짧게 재시도 */
export function restoreScrollY(y: number): void {
  if (typeof window === "undefined" || y <= 0) return;
  const apply = () => {
    window.scrollTo(0, y);
    document.documentElement.scrollTop = y;
    document.body.scrollTop = y;
  };
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
    window.setTimeout(apply, 50);
    window.setTimeout(apply, 200);
  });
}

/**
 * 목록 복원 가능 여부.
 * 시·도 불일치로 스킵하지 않음 — 마운트 직후 regionCity가 기본값일 수 있고,
 * 실제 거주 지역 변경은 REGION_CHANGED_EVENT에서 필터를 비운다.
 */
export function listStateMatchesCity<TFilters extends Record<string, string[]>>(
  saved: ListPageState<TFilters> | null,
  _regionCity: string
): boolean {
  return Boolean(saved);
}
