import { differenceInCalendarDays, isToday, parseISO } from "date-fns";

export function formatDeadline(applyEnd: string | null): string {
  if (!applyEnd) return "상시 접수";
  const end = parseISO(applyEnd);
  const days = differenceInCalendarDays(end, new Date());
  if (days < 0) return "마감";
  if (isToday(end)) return "오늘 마감";
  return `마감 ${days}일 전`;
}

export function DeadlineBadge({
  applyEnd,
  className = "",
  variant = "pill",
}: {
  applyEnd: string | null;
  className?: string;
  variant?: "pill" | "outline";
}) {
  const label = formatDeadline(applyEnd);
  const urgent =
    applyEnd &&
    differenceInCalendarDays(parseISO(applyEnd), new Date()) <= 3 &&
    label !== "마감";
  const expired = label === "마감";

  if (variant === "outline") {
    return (
      <span
        className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${
          expired
            ? "border-gray-300 text-gray-500"
            : urgent
              ? "border-deadline-urgent text-deadline-urgent"
              : "border-gray-300 text-deadline-normal"
        } ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[12.5px] font-bold ${
        expired
          ? "bg-gray-200 text-gray-500"
          : urgent
            ? "bg-red-50 text-deadline-urgent"
            : "bg-gray-100 text-deadline-normal"
      } ${className}`}
    >
      {label}
    </span>
  );
}
