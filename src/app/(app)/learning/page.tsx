"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LearningListCard } from "@/components/activity/ActivityCards";
import { ActivityFilterBar } from "@/components/list/ActivityFilterBar";
import { ListCategoryTabs } from "@/components/list/ListCategoryTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActivityActions } from "@/hooks/useActivityActions";
import { apiFetch } from "@/lib/api-client";
import { createEmptyFilters } from "@/lib/jobs-filters";
import {
  EDUCATION_TAB_FILTERS,
  HOBBY_TAB_FILTERS,
  filterLearningActivities,
} from "@/lib/learning-filters";
import type { Activity } from "@/lib/types";

const PAGE_TABS = [
  { id: "education", label: "교육" },
  { id: "hobby", label: "취미활동" },
];

export default function LearningPage() {
  const [category, setCategory] = useState<"education" | "hobby">("education");
  const [educationFilters, setEducationFilters] = useState(() =>
    createEmptyFilters(EDUCATION_TAB_FILTERS)
  );
  const [hobbyFilters, setHobbyFilters] = useState(() => createEmptyFilters(HOBBY_TAB_FILTERS));
  const { toggleBookmark, loading: bookmarkLoading, LikeDialog } = useActivityActions();

  const activeFilterDefs = category === "education" ? EDUCATION_TAB_FILTERS : HOBBY_TAB_FILTERS;
  const activeFilters = category === "education" ? educationFilters : hobbyFilters;

  const { data, isLoading } = useQuery({
    queryKey: ["activities", category],
    queryFn: () => apiFetch<{ items: Activity[] }>(`/activities?category=${category}`),
  });

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return filterLearningActivities(data.items, activeFilters);
  }, [data?.items, activeFilters]);

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);
  const emptyFromFilter = (data?.items?.length ?? 0) > 0 && filteredItems.length === 0;

  function handleCategoryChange(next: string) {
    const nextCategory = next as "education" | "hobby";
    if (nextCategory === "education") {
      setEducationFilters(createEmptyFilters(EDUCATION_TAB_FILTERS));
    } else {
      setHobbyFilters(createEmptyFilters(HOBBY_TAB_FILTERS));
    }
    setCategory(nextCategory);
  }

  function handleFilterChange(id: string, value: string) {
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

  return (
    <div className="min-h-full bg-[#f8f9fc] pb-4">
      {LikeDialog}
      <header className="bg-white px-6 pb-1 pt-6">
        <h1 className="text-[22px] font-bold text-[#1c1c27]">교육 · 취미활동</h1>
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
            description={emptyFromFilter ? "다른 조건을 선택해보세요." : "곧 새로운 활동이 등록될 예정입니다."}
            actionLabel={emptyFromFilter && hasActiveFilters ? "필터 초기화" : undefined}
            onAction={emptyFromFilter && hasActiveFilters ? resetFilters : undefined}
          />
        )}
        {filteredItems.map((activity) => (
          <LearningListCard
            key={activity.id}
            activity={activity}
            bookmarked={activity.bookmarked}
            bookmarkLoading={bookmarkLoading}
            onBookmark={() => toggleBookmark(activity.id)}
          />
        ))}
      </div>
    </div>
  );
}
