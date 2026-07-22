"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LearningListCard } from "@/components/activity/ActivityCards";
import { ActivityFilterBar } from "@/components/list/ActivityFilterBar";
import { ListCategoryTabs } from "@/components/list/ListCategoryTabs";
import { ListSearchInput } from "@/components/list/ListSearchInput";
import { ListPagination } from "@/components/list/ListPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api-client";
import { createEmptyFilters } from "@/lib/jobs-filters";
import {
  EDUCATION_TAB_FILTERS,
  HOBBY_TAB_FILTERS,
  filterLearningActivities,
} from "@/lib/learning-filters";
import { isViewed } from "@/lib/viewed";
import type { Activity } from "@/lib/types";

const PAGE_TABS = [
  { id: "education", label: "교육" },
  { id: "hobby", label: "취미활동" },
];

const TAB_KEY = "oyukirang-learning-tab";
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

export default function LearningPage() {
  const [category, setCategory] = useState<"education" | "hobby">("education");
  const [educationFilters, setEducationFilters] = useState(() =>
    createEmptyFilters(EDUCATION_TAB_FILTERS)
  );
  const [hobbyFilters, setHobbyFilters] = useState(() => createEmptyFilters(HOBBY_TAB_FILTERS));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewedTick, setViewedTick] = useState(0);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TAB_KEY);
      if (saved === "education" || saved === "hobby") setCategory(saved);
    } catch {
      /* ignore */
    }
    const onViewed = () => setViewedTick((t) => t + 1);
    window.addEventListener("ov-viewed-changed", onViewed);
    return () => window.removeEventListener("ov-viewed-changed", onViewed);
  }, []);

  const activeFilterDefs = category === "education" ? EDUCATION_TAB_FILTERS : HOBBY_TAB_FILTERS;
  const activeFilters = category === "education" ? educationFilters : hobbyFilters;

  const { data, isLoading } = useQuery({
    queryKey: ["activities", category],
    queryFn: () => apiFetch<{ items: Activity[] }>(`/activities?category=${category}`),
  });

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return filterLearningActivities(data.items, activeFilters).filter((a) =>
      matchesSearch(a, search)
    );
  }, [data?.items, activeFilters, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [category, activeFilters, search]);

  const hasActiveFilters = Object.values(activeFilters).some((arr) => arr.length > 0);
  const emptyFromFilter = (data?.items?.length ?? 0) > 0 && filteredItems.length === 0;

  function handleCategoryChange(next: string) {
    const nextCategory = next as "education" | "hobby";
    if (nextCategory === "education") {
      setEducationFilters(createEmptyFilters(EDUCATION_TAB_FILTERS));
    } else {
      setHobbyFilters(createEmptyFilters(HOBBY_TAB_FILTERS));
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
    if (category === "education") {
      setEducationFilters((prev) => ({ ...prev, [id]: value }));
    } else {
      setHobbyFilters((prev) => ({ ...prev, [id]: value }));
    }
  }

  function resetFilters() {
    if (category === "education") {
      setEducationFilters(createEmptyFilters(EDUCATION_TAB_FILTERS));
    } else {
      setHobbyFilters(createEmptyFilters(HOBBY_TAB_FILTERS));
    }
  }

  const emptyTitle =
    category === "education"
      ? emptyFromFilter
        ? "조건에 맞는 교육이 없어요."
        : "등록된 교육이 없어요"
      : emptyFromFilter
        ? "조건에 맞는 취미활동이 없어요."
        : "등록된 취미활동이 없어요";

  void viewedTick;

  return (
    <div className="min-h-full bg-[#f8f9fc] pb-4">
      <header className="bg-white px-6 pb-1 pt-6">
        <h1 className="text-[22px] font-bold text-[#141414]">교육 · 취미활동</h1>
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
            description={emptyFromFilter ? "다른 조건을 선택해보세요." : "곧 새로운 활동이 등록될 예정입니다."}
            actionLabel={emptyFromFilter && hasActiveFilters ? "필터 초기화" : undefined}
            onAction={emptyFromFilter && hasActiveFilters ? resetFilters : undefined}
          />
        )}
        {pageItems.map((activity) => (
          <LearningListCard
            key={activity.id}
            activity={activity}
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
