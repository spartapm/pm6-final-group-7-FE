"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RecommendationCard } from "@/components/activity/ActivityCards";
import { ActivityFilterBar } from "@/components/list/ActivityFilterBar";
import { ListCategoryTabs } from "@/components/list/ListCategoryTabs";
import { ListSearchInput } from "@/components/list/ListSearchInput";
import { ListPagination } from "@/components/list/ListPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api-client";
import {
  JOB_TAB_FILTERS,
  SUPPORT_TAB_FILTERS,
  createEmptyFilters,
  filterActivities,
} from "@/lib/jobs-filters";
import { isViewed } from "@/lib/viewed";
import type { Activity } from "@/lib/types";

const PAGE_TABS = [
  { id: "job", label: "채용 공고" },
  { id: "support", label: "지원사업" },
];

const TAB_KEY = "oyukirang-jobs-tab";
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

export default function JobsPage() {
  const [category, setCategory] = useState<"job" | "support">("job");
  const [jobFilters, setJobFilters] = useState(() => createEmptyFilters(JOB_TAB_FILTERS));
  const [supportFilters, setSupportFilters] = useState(() => createEmptyFilters(SUPPORT_TAB_FILTERS));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewedTick, setViewedTick] = useState(0);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TAB_KEY);
      if (saved === "job" || saved === "support") setCategory(saved);
    } catch {
      /* ignore */
    }
    const onViewed = () => setViewedTick((t) => t + 1);
    window.addEventListener("ov-viewed-changed", onViewed);
    return () => window.removeEventListener("ov-viewed-changed", onViewed);
  }, []);

  const activeFilterDefs = category === "job" ? JOB_TAB_FILTERS : SUPPORT_TAB_FILTERS;
  const activeFilters = category === "job" ? jobFilters : supportFilters;

  const { data, isLoading } = useQuery({
    queryKey: ["activities", category],
    queryFn: () => apiFetch<{ items: Activity[] }>(`/activities?category=${category}`),
  });

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return filterActivities(data.items, category, activeFilters).filter((a) =>
      matchesSearch(a, search)
    );
  }, [data?.items, category, activeFilters, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [category, activeFilters, search]);

  const hasActiveFilters = Object.values(activeFilters).some((arr) => arr.length > 0);
  const emptyFromFilter = (data?.items?.length ?? 0) > 0 && filteredItems.length === 0;

  function handleCategoryChange(next: string) {
    const nextCategory = next as "job" | "support";
    if (nextCategory === "job") {
      setJobFilters(createEmptyFilters(JOB_TAB_FILTERS));
    } else {
      setSupportFilters(createEmptyFilters(SUPPORT_TAB_FILTERS));
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
      setJobFilters(createEmptyFilters(JOB_TAB_FILTERS));
    } else {
      setSupportFilters(createEmptyFilters(SUPPORT_TAB_FILTERS));
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
        key={category}
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
          <ListPagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
