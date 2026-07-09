"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RecommendationCard } from "@/components/activity/ActivityCards";
import { ActivityFilterBar } from "@/components/list/ActivityFilterBar";
import { ListCategoryTabs } from "@/components/list/ListCategoryTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActivityActions } from "@/hooks/useActivityActions";
import { apiFetch } from "@/lib/api-client";
import {
  JOB_TAB_FILTERS,
  SUPPORT_TAB_FILTERS,
  createEmptyFilters,
  filterActivities,
} from "@/lib/jobs-filters";
import type { Activity } from "@/lib/types";

const PAGE_TABS = [
  { id: "job", label: "채용 공고" },
  { id: "support", label: "지원사업" },
];

export default function JobsPage() {
  const [category, setCategory] = useState<"job" | "support">("job");
  const [jobFilters, setJobFilters] = useState(() => createEmptyFilters(JOB_TAB_FILTERS));
  const [supportFilters, setSupportFilters] = useState(() => createEmptyFilters(SUPPORT_TAB_FILTERS));
  const { toggleBookmark, loading: bookmarkLoading, LikeDialog } = useActivityActions();

  const activeFilterDefs = category === "job" ? JOB_TAB_FILTERS : SUPPORT_TAB_FILTERS;
  const activeFilters = category === "job" ? jobFilters : supportFilters;

  const { data, isLoading } = useQuery({
    queryKey: ["activities", category],
    queryFn: () => apiFetch<{ items: Activity[] }>(`/activities?category=${category}`),
  });

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return filterActivities(data.items, category, activeFilters);
  }, [data?.items, category, activeFilters]);

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);
  const emptyFromFilter = (data?.items?.length ?? 0) > 0 && filteredItems.length === 0;

  function handleCategoryChange(next: string) {
    const nextCategory = next as "job" | "support";
    if (nextCategory === "job") {
      setJobFilters(createEmptyFilters(JOB_TAB_FILTERS));
    } else {
      setSupportFilters(createEmptyFilters(SUPPORT_TAB_FILTERS));
    }
    setCategory(nextCategory);
  }

  function handleFilterChange(id: string, value: string) {
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

  return (
    <div className="min-h-full bg-[#f8f9fc] pb-4">
      {LikeDialog}
      <header className="bg-white px-6 pb-1 pt-6">
        <h1 className="text-[22px] font-bold text-[#1c1c27]">일자리 · 지원사업</h1>
      </header>

      <ListCategoryTabs tabs={PAGE_TABS} activeId={category} onChange={handleCategoryChange} />

      <ActivityFilterBar
        key={category}
        filters={activeFilterDefs}
        values={activeFilters}
        onChange={handleFilterChange}
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
        {filteredItems.map((activity) => (
          <RecommendationCard
            key={activity.id}
            activity={activity}
            showReasons={false}
            expired={activity.status === "expired"}
            bookmarked={activity.bookmarked}
            bookmarkLoading={bookmarkLoading}
            onBookmark={() => toggleBookmark(activity.id)}
          />
        ))}
      </div>
    </div>
  );
}
