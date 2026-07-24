"use client";

/**
 * /jobs · /learning 공통: 상세 복귀 시 필터·검색·페이지·스크롤 유지
 * - 마운트 직후 빈 값으로 sessionStorage를 덮어쓰지 않음
 * - regionCity 하이드레이션으로 필터를 지우지 않음 (거주 지역 변경 이벤트만)
 */

import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from "react";
import {
  listStateMatchesCity,
  loadListPageState,
  readScrollY,
  restoreScrollY,
  saveListPageState,
  type ListPageState,
} from "@/lib/list-page-state";
import { REGION_CHANGED_EVENT } from "@/lib/region-events";

type FiltersMap = Record<string, Record<string, string[]>>;

export function useListPagePersistence<TFilters extends Record<string, string[]>>(options: {
  storageKey: string;
  regionCity: string;
  category: string;
  filtersByCategory: FiltersMap;
  search: string;
  page: number;
  listReady: boolean;
  pageItemCount: number;
  onRestore: (saved: ListPageState<TFilters>) => void;
  onRegionChangedByUser: () => void;
}): { skipPageResetRef: MutableRefObject<boolean> } {
  const {
    storageKey,
    regionCity,
    category,
    filtersByCategory,
    search,
    page,
    listReady,
    pageItemCount,
    onRestore,
    onRegionChangedByUser,
  } = options;

  const persistReadyRef = useRef(false);
  const pendingScrollRef = useRef<number | null>(null);
  const skipPageResetRef = useRef(true);
  const onRestoreRef = useRef(onRestore);
  const onRegionChangedRef = useRef(onRegionChangedByUser);
  onRestoreRef.current = onRestore;
  onRegionChangedRef.current = onRegionChangedByUser;

  const stateRef = useRef({
    category,
    filtersByCategory,
    search,
    page,
    regionCity,
  });
  stateRef.current = { category, filtersByCategory, search, page, regionCity };

  useLayoutEffect(() => {
    const saved = loadListPageState<TFilters>(storageKey);
    if (listStateMatchesCity(saved, regionCity) && saved) {
      onRestoreRef.current(saved);
      if (typeof saved.scrollY === "number" && saved.scrollY > 0) {
        pendingScrollRef.current = saved.scrollY;
      }
    }
    // 복원 setState가 반영된 뒤에만 저장 허용 (빈 값으로 sessionStorage 덮어쓰기 방지)
    const readyTimer = window.setTimeout(() => {
      persistReadyRef.current = true;
      const s = stateRef.current;
      saveListPageState(storageKey, {
        category: s.category,
        filtersByCategory: s.filtersByCategory as ListPageState<TFilters>["filtersByCategory"],
        search: s.search,
        page: s.page,
        scrollY: readScrollY(),
        regionCity: s.regionCity,
      });
    }, 0);
    const unlock = window.setTimeout(() => {
      skipPageResetRef.current = false;
    }, 0);
    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!persistReadyRef.current) return;
    saveListPageState(storageKey, {
      category,
      filtersByCategory: filtersByCategory as ListPageState<TFilters>["filtersByCategory"],
      search,
      page,
      scrollY: readScrollY(),
      regionCity,
    });
  }, [storageKey, category, filtersByCategory, search, page, regionCity]);

  useEffect(() => {
    const persist = () => {
      if (!persistReadyRef.current) return;
      const s = stateRef.current;
      saveListPageState(storageKey, {
        category: s.category,
        filtersByCategory: s.filtersByCategory as ListPageState<TFilters>["filtersByCategory"],
        search: s.search,
        page: s.page,
        scrollY: readScrollY(),
        regionCity: s.regionCity,
      });
    };
    window.addEventListener("scroll", persist, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      persist();
      window.removeEventListener("scroll", persist);
      window.removeEventListener("pagehide", persist);
    };
  }, [storageKey]);

  useEffect(() => {
    if (!listReady) return;
    const y = pendingScrollRef.current;
    if (y == null) return;
    pendingScrollRef.current = null;
    restoreScrollY(y);
  }, [listReady, pageItemCount, page]);

  useEffect(() => {
    const handler = () => onRegionChangedRef.current();
    window.addEventListener(REGION_CHANGED_EVENT, handler);
    return () => window.removeEventListener(REGION_CHANGED_EVENT, handler);
  }, []);

  return { skipPageResetRef };
}
