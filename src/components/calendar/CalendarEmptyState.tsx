"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { getCalendarEmptyMessage, type CalendarEmptyReason } from "@/lib/calendar-utils";

interface Props {
  reason: CalendarEmptyReason;
  onRetry?: () => void;
}

export function CalendarEmptyState({ reason, onRetry }: Props) {
  const { title, description } = getCalendarEmptyMessage(reason);
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={reason === "error" ? "다시 시도" : undefined}
      onAction={reason === "error" ? onRetry : undefined}
    />
  );
}
