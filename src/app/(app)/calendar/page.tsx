"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";
import { AppHeader } from "@/components/layout/AppHeader";
import { CalendarMonthHeader } from "@/components/calendar/CalendarMonthHeader";
import { CalendarGrid, CalendarLegend } from "@/components/calendar/CalendarGrid";
import {
  CalendarFilterBar,
  CalendarScheduleHeader,
} from "@/components/calendar/CalendarFilterBar";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { CalendarEmptyState } from "@/components/calendar/CalendarEmptyState";
import { apiFetch } from "@/lib/api-client";
import { filterCalendarItems, type CalendarItem } from "@/lib/calendar-utils";

export default function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [appliedOnly, setAppliedOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => apiFetch<{ items: CalendarItem[] }>("/calendar"),
  });

  const allItems = data?.items ?? [];
  const listItems = filterCalendarItems(allItems, {
    month,
    selectedDate,
    category,
    appliedOnly,
  });

  function getEmptyReason(): "no_saved" | "no_date" | "no_filter" | null {
    if (allItems.length === 0) return "no_saved";
    if (listItems.length > 0) return null;
    if (selectedDate) return "no_date";
    return "no_filter";
  }

  const emptyReason = getEmptyReason();

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-8">
      <AppHeader title="내 캘린더" showNotification={false} />

      <CalendarMonthHeader month={month} onChange={setMonth} />
      <CalendarGrid
        month={month}
        items={allItems}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        category={category}
        appliedOnly={appliedOnly}
      />
      <CalendarLegend />

      <CalendarFilterBar
        category={category}
        appliedOnly={appliedOnly}
        onCategoryChange={setCategory}
        onAppliedOnlyChange={setAppliedOnly}
      />

      <CalendarScheduleHeader month={month} />

      <div className="px-5 pb-4">
        {isLoading && <p className="py-8 text-center text-text-muted">불러오는 중...</p>}
        {isError && <CalendarEmptyState reason="error" onRetry={() => refetch()} />}
        {!isLoading && !isError && emptyReason && <CalendarEmptyState reason={emptyReason} />}
        {!isLoading &&
          !isError &&
          listItems.map((item) => <CalendarEventCard key={item.activity.id} item={item} />)}
      </div>
    </div>
  );
}
