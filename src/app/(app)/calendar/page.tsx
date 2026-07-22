"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { AppHeader } from "@/components/layout/AppHeader";
import { CalendarMonthHeader } from "@/components/calendar/CalendarMonthHeader";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import {
  CalendarFilterBar,
  CalendarScheduleHeader,
} from "@/components/calendar/CalendarFilterBar";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { CalendarEmptyState } from "@/components/calendar/CalendarEmptyState";
import { MonthIndexRail } from "@/components/calendar/MonthIndexRail";
import { ApiError, apiFetch } from "@/lib/api-client";
import { groupCalendarItemsByMonth, type CalendarItem } from "@/lib/calendar-utils";

/** 리스트 스크롤 시 스티키 월 헤더가 가리는 높이 보정 */
const STICKY_HEADER_OFFSET = 48;
/** 이 이상 스크롤하면 미니 캘린더 접힘 */
const COLLAPSE_SCROLL_Y = 40;

export default function CalendarPage() {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  /** 미니 캘린더(좌우) 전용 — 리스트/인덱스와 무관 */
  const [gridYear, setGridYear] = useState(todayYear);
  const [gridMonthNum, setGridMonthNum] = useState(todayMonth);
  /** 우측 인덱스·리스트 스크롤 하이라이트 전용 */
  const [listMonth, setListMonth] = useState(todayMonth);
  /** 일정 리스트가 보여주는 연도 — 미니 캘린더 연도와 분리 */
  const [listYear, setListYear] = useState(todayYear);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [appliedOnly, setAppliedOnly] = useState(false);
  /** true=전체 월, false=약 2주 — 펼치면 아래 일정이 함께 밀림 */
  const [expanded, setExpanded] = useState(true);
  // H-4: 찜 해제한 항목도 탭을 떠나기 전까지 리스트에 유지
  const [ghostItems, setGhostItems] = useState<CalendarItem[]>([]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const didInitialScroll = useRef(false);
  /** 펼쳐보기 직후 스크롤 이벤트로 바로 다시 접히는 것 방지 */
  const ignoreCollapseUntil = useRef(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar"],
    queryFn: async () => {
      try {
        return await apiFetch<{ items: CalendarItem[] }>("/calendar");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return { items: [] as CalendarItem[] };
        }
        throw err;
      }
    },
    retry: false,
  });

  const fetchedItems = data?.items ?? [];
  const allItems = [
    ...fetchedItems,
    ...ghostItems.filter(
      (g) => !fetchedItems.some((i) => i.activity.id === g.activity.id)
    ),
  ];
  const hasNoSaved = !isLoading && !isError && allItems.length === 0;
  const monthGroups = groupCalendarItemsByMonth(allItems, listYear, {
    category,
    appliedOnly,
  });
  const monthsWithData = new Set(
    monthGroups.flatMap((items, i) => (items.length > 0 ? [i + 1] : []))
  );
  const visibleMonthGroups = monthGroups
    .map((items, index) => ({ month: index + 1, items }))
    .filter(({ items }) => items.length > 0);

  const gridMonth = new Date(gridYear, gridMonthNum - 1, 1);
  const collapsed = !expanded;

  const scrollToMonth = useCallback(
    (month: number, behavior: ScrollBehavior = "smooth") => {
      const list = listRef.current;
      const section = sectionRefs.current[month - 1];
      if (!list || !section) return;
      list.scrollTo({ top: section.offsetTop, behavior });
    },
    []
  );

  function nearestMonthWithData(preferred: number): number | null {
    if (monthsWithData.size === 0) return null;
    if (monthsWithData.has(preferred)) return preferred;
    const sorted = [...monthsWithData].sort((a, b) => a - b);
    return (
      sorted.find((m) => m >= preferred) ?? sorted[sorted.length - 1] ?? null
    );
  }

  // 진입/데이터 없음: 항상 오늘이 속한 달로 고정
  useEffect(() => {
    if (isLoading) return;

    if (hasNoSaved) {
      setGridYear(todayYear);
      setGridMonthNum(todayMonth);
      setListYear(todayYear);
      setListMonth(todayMonth);
      return;
    }

    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    setGridYear(todayYear);
    setGridMonthNum(todayMonth);
    setListYear(todayYear);
    setListMonth(todayMonth);
    const target = nearestMonthWithData(todayMonth) ?? todayMonth;
    requestAnimationFrame(() => scrollToMonth(target, "auto"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasNoSaved, todayYear, todayMonth, scrollToMonth]);

  function handleListScroll() {
    const list = listRef.current;
    if (!list) return;
    const top = list.scrollTop;

    if (Date.now() > ignoreCollapseUntil.current) {
      // 아래로 스크롤하면 접힘 — 펼침은 버튼으로만 (맨 위에서 접어보기 직후 다시 펴지지 않도록)
      if (top > COLLAPSE_SCROLL_Y && expanded) setExpanded(false);
    }

    // 월 섹션이 없으면(데이터 없음) 스크롤로 월을 바꾸지 않음
    const hasSections = sectionRefs.current.some(Boolean);
    if (!hasSections) return;

    let current: number | null = null;
    for (let i = 0; i < 12; i += 1) {
      const section = sectionRefs.current[i];
      if (section && section.offsetTop <= top + STICKY_HEADER_OFFSET + 12) {
        current = i + 1;
      }
    }
    // 리스트 스크롤은 인덱스 하이라이트만 — 미니 캘린더와 무관
    if (current != null && current !== listMonth) setListMonth(current);
  }

  function handleExpandToggle() {
    if (collapsed) {
      ignoreCollapseUntil.current = Date.now() + 400;
      setExpanded(true);
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setExpanded(false);
    }
  }

  function handleMonthChange(next: Date) {
    // 미니 캘린더만 변경 — 리스트·인덱스와 연결 없음
    setGridYear(next.getFullYear());
    setGridMonthNum(next.getMonth() + 1);
  }

  function handleSelectDate(dateKey: string | null) {
    setSelectedDate(dateKey);
    if (!dateKey) return;
    const list = listRef.current;
    if (!list) return;
    const card = list.querySelector<HTMLElement>(`[data-deadline="${dateKey}"]`);
    if (card) {
      const top =
        list.scrollTop +
        card.getBoundingClientRect().top -
        list.getBoundingClientRect().top -
        STICKY_HEADER_OFFSET;
      list.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    } else {
      scrollToMonth(parseISO(dateKey).getMonth() + 1);
    }
  }

  function handleUnbookmarked(item: CalendarItem) {
    setGhostItems((prev) =>
      prev.some((g) => g.activity.id === item.activity.id) ? prev : [...prev, item]
    );
  }

  return (
    <div
      className="flex flex-col bg-[#f8f9fc]"
      style={{ height: "calc(100dvh - var(--bottom-tab-nav-offset))" }}
    >
      <div className="shrink-0">
        <AppHeader title="내 캘린더" showNotification={false} />
      </div>

      {/* 달력+필터+일정을 한 스크롤로 — 펼침 시 아래가 밀리고 배경이 잘리지 않음 */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={handleListScroll}
          className="h-full overflow-y-auto bg-[#f8f9fc] pb-8"
        >
          <div className="bg-[#f8f9fc] pb-1">
            <CalendarMonthHeader month={gridMonth} onChange={handleMonthChange} />

            <CalendarGrid
              month={gridMonth}
              items={allItems}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              category={category}
              appliedOnly={appliedOnly}
              collapsed={collapsed}
            />
            <button
              type="button"
              onClick={handleExpandToggle}
              className="mx-auto mt-1.5 flex items-center gap-1 px-3 py-1 text-[13px] font-semibold text-[#8b90a0]"
            >
              {collapsed ? "펼쳐보기 ▼" : "접어보기 ▲"}
            </button>

            <CalendarFilterBar
              category={category}
              appliedOnly={appliedOnly}
              onCategoryChange={setCategory}
              onAppliedOnlyChange={setAppliedOnly}
            />
          </div>

          <div
            className={`flex bg-[#edeffb] ${
              hasNoSaved || isError ? "min-h-[40dvh]" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              {isLoading && (
                <p className="py-8 text-center text-text-muted">불러오는 중...</p>
              )}
              {isError && (
                <div className="px-5">
                  <CalendarEmptyState reason="error" onRetry={() => refetch()} />
                </div>
              )}
              {hasNoSaved && (
                <div className="px-5">
                  <CalendarEmptyState reason="no_saved" />
                </div>
              )}

              {!isLoading &&
                !isError &&
                !hasNoSaved &&
                visibleMonthGroups.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-[#b0b4c0]">
                    조건에 맞는 일정이 없어요
                  </p>
                )}

              {!isLoading &&
                !isError &&
                !hasNoSaved &&
                visibleMonthGroups.map(({ month, items }) => (
                  <section
                    key={month}
                    ref={(el) => {
                      sectionRefs.current[month - 1] = el;
                    }}
                  >
                    <CalendarScheduleHeader monthNumber={month} />
                    <div className="pb-3 pl-5 pr-3">
                      {items.map((item) => (
                        <CalendarEventCard
                          key={`${month}-${item.activity.id}`}
                          item={item}
                          onUnbookmarked={handleUnbookmarked}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>

            {!isLoading && !isError && (
              <MonthIndexRail
                activeMonth={listMonth}
                enabledMonths={hasNoSaved ? [] : monthsWithData}
                onSelect={(m) => {
                  if (!monthsWithData.has(m)) return;
                  setListMonth(m);
                  scrollToMonth(m);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
