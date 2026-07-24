"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  filterLearningActivities,
  getEducationTabFilters,
  getHobbyTabFilters,
  type LearningFilterValues,
} from "@/lib/learning-filters";
import { activitiesQueryUrl, useUserRegion } from "@/hooks/useUserRegion";
import { useListPagePersistence } from "@/hooks/useListPagePersistence";
import { loadListPageState, type ListPageState } from "@/lib/list-page-state";
import { isViewed } from "@/lib/viewed";
import type { Activity } from "@/lib/types";

const PAGE_TABS = [
  { id: "education", label: "교육" },
  { id: "hobby", label: "취미활동" },
];

const TAB_KEY = "oyukirang-learning-tab";
const LIST_STATE_KEY = "oyukirang-learning-list-state";
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

function readInitialLearningState(): {
  category: "education" | "hobby";
  educationFilters: LearningFilterValues | null;
  hobbyFilters: LearningFilterValues | null;
  search: string;
  page: number;
} {
  if (typeof window === "undefined") {
    return {
      category: "education",
      educationFilters: null,
      hobbyFilters: null,
      search: "",
      page: 1,
    };
  }
  const saved = loadListPageState<LearningFilterValues>(LIST_STATE_KEY);
  let category: "education" | "hobby" = "education";
  try {
    const tab = sessionStorage.getItem(TAB_KEY);
    if (tab === "education" || tab === "hobby") category = tab;
    else if (saved?.category === "education" || saved?.category === "hobby") {
      category = saved.category;
    }
  } catch {
    /* ignore */
  }
  if (!saved) {
    return {
      category,
      educationFilters: null,
      hobbyFilters: null,
      search: "",
      page: 1,
    };
  }
  return {
    category,
    educationFilters: saved.filtersByCategory.education ?? null,
    hobbyFilters: saved.filtersByCategory.hobby ?? null,
    search: typeof saved.search === "string" ? saved.search : "",
    page: typeof saved.page === "number" && saved.page >= 1 ? saved.page : 1,
  };
}

export default function LearningPage() {
  const { regionCity, regionDistrict } = useUserRegion();
  const [initial] = useState(readInitialLearningState);
  const [category, setCategory] = useState<"education" | "hobby">(initial.category);
  const educationFilterDefs = useMemo(() => getEducationTabFilters(regionCity), [regionCity]);
  const hobbyFilterDefs = useMemo(() => getHobbyTabFilters(regionCity), [regionCity]);
  const [educationFilters, setEducationFilters] = useState(
    () => initial.educationFilters ?? createEmptyFilters(getEducationTabFilters(regionCity))
  );
  const [hobbyFilters, setHobbyFilters] = useState(
    () => initial.hobbyFilters ?? createEmptyFilters(getHobbyTabFilters(regionCity))
  );
  const [search, setSearch] = useState(initial.search);
  const [page, setPage] = useState(initial.page);
  const [viewedTick, setViewedTick] = useState(0);

  const handleRestore = useCallback((saved: ListPageState<LearningFilterValues>) => {
    try {
      const tab = sessionStorage.getItem(TAB_KEY);
      if (tab === "education" || tab === "hobby") setCategory(tab);
      else if (saved.category === "education" || saved.category === "hobby") {
        setCategory(saved.category);
      }
    } catch {
      if (saved.category === "education" || saved.category === "hobby") {
        setCategory(saved.category);
      }
    }
    if (saved.filtersByCategory.education) setEducationFilters(saved.filtersByCategory.education);
    if (saved.filtersByCategory.hobby) setHobbyFilters(saved.filtersByCategory.hobby);
    if (typeof saved.search === "string") setSearch(saved.search);
    if (typeof saved.page === "number" && saved.page >= 1) setPage(saved.page);
  }, []);

  const handleRegionChangedByUser = useCallback(() => {
    setEducationFilters(createEmptyFilters(getEducationTabFilters(regionCity)));
    setHobbyFilters(createEmptyFilters(getHobbyTabFilters(regionCity)));
    setSearch("");
    setPage(1);
  }, [regionCity]);

  const activeFilterDefs = category === "education" ? educationFilterDefs : hobbyFilterDefs;
  const activeFilters = category === "education" ? educationFilters : hobbyFilters;
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
    return filterLearningActivities(data.items, activeFilters, category, regionCity).filter((a) =>
      matchesSearch(a, search)
    );
  }, [data?.items, activeFilters, search, category, regionCity]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const { skipPageResetRef } = useListPagePersistence<LearningFilterValues>({
    storageKey: LIST_STATE_KEY,
    regionCity,
    category,
    filtersByCategory: { education: educationFilters, hobby: hobbyFilters },
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
    const nextCategory = next as "education" | "hobby";
    if (nextCategory === "education") {
      setEducationFilters(createEmptyFilters(educationFilterDefs));
    } else {
      setHobbyFilters(createEmptyFilters(hobbyFilterDefs));
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
      setEducationFilters(createEmptyFilters(educationFilterDefs));
    } else {
      setHobbyFilters(createEmptyFilters(hobbyFilterDefs));
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
          <ListPagination page={safePage} totalPages={totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
