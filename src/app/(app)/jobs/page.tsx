"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RecommendationCard } from "@/components/activity/ActivityCards";
import { ActivityFilterBar } from "@/components/list/ActivityFilterBar";
import { ListCategoryTabs } from "@/components/list/ListCategoryTabs";
import { ListSearchInput } from "@/components/list/ListSearchInput";
import { ListPagination } from "@/components/list/ListPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api-client";
import {
  createEmptyFilters,
  filterActivities,
  getJobTabFilters,
  getSupportTabFilters,
  type JobsFilterValues,
} from "@/lib/jobs-filters";
import { activitiesQueryUrl, useUserRegion } from "@/hooks/useUserRegion";
import { useListPagePersistence } from "@/hooks/useListPagePersistence";
import { loadListPageState, type ListPageState } from "@/lib/list-page-state";
import { isViewed } from "@/lib/viewed";
import type { Activity } from "@/lib/types";

const PAGE_TABS = [
  { id: "job", label: "채용 공고" },
  { id: "support", label: "지원사업" },
];

const TAB_KEY = "oyukirang-jobs-tab";
const LIST_STATE_KEY = "oyukirang-jobs-list-state";
const PAGE_SIZE = 10;

function matchesSearch(activity: Activity, q: string): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const hay = [
    activity.title,
    activity.org_name,
    activity.region_district ?? "",
    activity.region_city ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

function readInitialJobsState(): {
  category: "job" | "support";
  jobFilters: JobsFilterValues | null;
  supportFilters: JobsFilterValues | null;
  search: string;
  page: number;
} {
  if (typeof window === "undefined") {
    return { category: "job", jobFilters: null, supportFilters: null, search: "", page: 1 };
  }
  const saved = loadListPageState<JobsFilterValues>(LIST_STATE_KEY);
  let category: "job" | "support" = "job";
  try {
    const tab = sessionStorage.getItem(TAB_KEY);
    if (tab === "job" || tab === "support") category = tab;
    else if (saved?.category === "job" || saved?.category === "support") category = saved.category;
  } catch {
    /* ignore */
  }
  if (!saved) {
    return { category, jobFilters: null, supportFilters: null, search: "", page: 1 };
  }
  return {
    category,
    jobFilters: saved.filtersByCategory.job ?? null,
    supportFilters: saved.filtersByCategory.support ?? null,
    search: typeof saved.search === "string" ? saved.search : "",
    page: typeof saved.page === "number" && saved.page >= 1 ? saved.page : 1,
  };
}

export default function JobsPage() {
  const { regionCity, regionDistrict } = useUserRegion();
  const [initial] = useState(readInitialJobsState);
  const [category, setCategory] = useState<"job" | "support">(initial.category);
  const jobFilterDefs = useMemo(() => getJobTabFilters(regionCity), [regionCity]);
  const supportFilterDefs = useMemo(() => getSupportTabFilters(regionCity), [regionCity]);
  const [jobFilters, setJobFilters] = useState(
    () => initial.jobFilters ?? createEmptyFilters(getJobTabFilters(regionCity))
  );
  const [supportFilters, setSupportFilters] = useState(
    () => initial.supportFilters ?? createEmptyFilters(getSupportTabFilters(regionCity))
  );
  const [search, setSearch] = useState(initial.search);
  const [page, setPage] = useState(initial.page);
  const [viewedTick, setViewedTick] = useState(0);

  const handleRestore = useCallback((saved: ListPageState<JobsFilterValues>) => {
    try {
      const tab = sessionStorage.getItem(TAB_KEY);
      if (tab === "job" || tab === "support") setCategory(tab);
      else if (saved.category === "job" || saved.category === "support") setCategory(saved.category);
    } catch {
      if (saved.category === "job" || saved.category === "support") setCategory(saved.category);
    }
    if (saved.filtersByCategory.job) setJobFilters(saved.filtersByCategory.job);
    if (saved.filtersByCategory.support) setSupportFilters(saved.filtersByCategory.support);
    if (typeof saved.search === "string") setSearch(saved.search);
    if (typeof saved.page === "number" && saved.page >= 1) setPage(saved.page);
  }, []);

  const handleRegionChangedByUser = useCallback(() => {
    setJobFilters(createEmptyFilters(getJobTabFilters(regionCity)));
    setSupportFilters(createEmptyFilters(getSupportTabFilters(regionCity)));
    setSearch("");
    setPage(1);
  }, [regionCity]);

  const activeFilterDefs = category === "job" ? jobFilterDefs : supportFilterDefs;
  const activeFilters = category === "job" ? jobFilters : supportFilters;
  const selectedDistricts = activeFilters.region ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["activities", category, regionCity, regionDistrict, selectedDistricts],
    queryFn: () =>
      apiFetch<{ items: Activity[] }>(
        activitiesQueryUrl(category, regionCity, regionDistrict, selectedDistricts)
      ),
  });

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return filterActivities(data.items, category, activeFilters, regionCity).filter((a) =>
      matchesSearch(a, search)
    );
  }, [data?.items, category, activeFilters, search, regionCity]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const { skipPageResetRef } = useListPagePersistence<JobsFilterValues>({
    storageKey: LIST_STATE_KEY,
    regionCity,
    category,
    filtersByCategory: { job: jobFilters, support: supportFilters },
    search,
    page: safePage,
    listReady: !isLoading,
    pageItemCount: pageItems.length,
    onRestore: handleRestore,
    onRegionChangedByUser: handleRegionChangedByUser,
  });

  useEffect(() => {
    if (skipPageResetRef.current) return;
    setPage(1);
  }, [category, activeFilters, search, skipPageResetRef]);

  useEffect(() => {
    const onViewed = () => setViewedTick((t) => t + 1);
    window.addEventListener("ov-viewed-changed", onViewed);
    return () => window.removeEventListener("ov-viewed-changed", onViewed);
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some((arr) => arr.length > 0);
  const emptyFromFilter = (data?.items?.length ?? 0) > 0 && filteredItems.length === 0;

  function handleCategoryChange(next: string) {
    const nextCategory = next as "job" | "support";
    if (nextCategory === "job") {
      setJobFilters(createEmptyFilters(jobFilterDefs));
    } else {
      setSupportFilters(createEmptyFilters(supportFilterDefs));
    }
    setCategory(nextCategory);
    setSearch("");
    try {
      sessionStorage.setItem(TAB_KEY, nextCategory);
    } catch {
      /* ignore */
    }
  }

  function handleFilterChange(id: string, value: string[]) {
    if (category === "job") {
      setJobFilters((prev) => ({ ...prev, [id]: value }));
    } else {
      setSupportFilters((prev) => ({ ...prev, [id]: value }));
    }
  }

  function resetFilters() {
    if (category === "job") {
      setJobFilters(createEmptyFilters(jobFilterDefs));
    } else {
      setSupportFilters(createEmptyFilters(supportFilterDefs));
    }
  }

  const emptyTitle =
    category === "job"
      ? emptyFromFilter
        ? "조건에 맞는 채용 공고가 없어요."
        : "등록된 공고가 없어요"
      : emptyFromFilter
        ? "조건에 맞는 지원사업이 없어요."
        : "등록된 지원사업이 없어요";

  void viewedTick;

  return (
    <div className="min-h-full bg-[#f8f9fc] pb-4">
      <header className="bg-white px-6 pb-1 pt-6">
        <h1 className="text-[22px] font-bold text-[#141414]">일자리 · 지원사업</h1>
      </header>

      <ListSearchInput value={search} onChange={setSearch} />

      <ListCategoryTabs tabs={PAGE_TABS} activeId={category} onChange={handleCategoryChange} />

      <ActivityFilterBar
        key={`${category}-${regionCity}`}
        filters={activeFilterDefs}
        values={activeFilters}
        onChange={handleFilterChange}
        onReset={resetFilters}
      />

      <div className="px-5 py-4">
        {isLoading && <p className="py-10 text-center text-text-muted">불러오는 중...</p>}
        {!isLoading && filteredItems.length === 0 && (
          <EmptyState
            title={emptyTitle}
            description={emptyFromFilter ? "다른 조건을 선택해보세요." : "곧 새로운 공고가 등록될 예정입니다."}
            actionLabel={emptyFromFilter && hasActiveFilters ? "필터 초기화" : undefined}
            onAction={emptyFromFilter && hasActiveFilters ? resetFilters : undefined}
          />
        )}
        {pageItems.map((activity) => (
          <RecommendationCard
            key={activity.id}
            activity={activity}
            showReasons={false}
            expired={activity.status === "expired"}
            bookmarked={activity.bookmarked}
            viewed={isViewed(activity.id)}
          />
        ))}
        {!isLoading && filteredItems.length > 0 && (
          <ListPagination page={safePage} totalPages={totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
