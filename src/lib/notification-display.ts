import {
  differenceInCalendarDays,
  format,
  isThisWeek,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { NotificationItem, NotificationType } from "./types";

export const NOTIFICATION_EMOJI: Record<NotificationType, string> = {
  recommendation: "🎯",
  region: "📍",
  interest: "💡",
  career: "💼",
  preference: "🔎",
  support: "🏛️",
  deadline_bookmark: "⏰",
  deadline_recommend: "🔥",
  hobby: "🌿",
  onboarding_complete: "🎉",
};

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  recommendation: "맞춤 추천",
  region: "지역 활동",
  interest: "관심 분야",
  career: "경력 채용",
  preference: "선호 조건",
  support: "지원사업",
  deadline_bookmark: "찜 마감",
  deadline_recommend: "맞춤 마감",
  hobby: "취미 활동",
  onboarding_complete: "온보딩 완료",
};

export type DateGroupKey = "today" | "yesterday" | "thisWeek" | "older";

export const DATE_GROUP_LABELS: Record<DateGroupKey, string> = {
  today: "오늘",
  yesterday: "어제",
  thisWeek: "이번 주",
  older: "이전",
};

export function getNotificationEmoji(type: string): string {
  return NOTIFICATION_EMOJI[type as NotificationType] ?? "🔔";
}

export function getDisplayTitle(notification: NotificationItem): string {
  const raw = notification.title.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "");
  return raw.trim() || notification.title;
}

export function formatRelativeTime(iso: string): string {
  const date = parseISO(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = differenceInCalendarDays(now, date);
  if (diffDay < 7) return `${diffDay}일 전`;
  return format(date, "M월 d일", { locale: ko });
}

export function getDateGroup(iso: string): DateGroupKey {
  const date = parseISO(iso);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "thisWeek";
  return "older";
}

export function groupNotificationsByDate(
  items: NotificationItem[]
): Array<{ key: DateGroupKey; label: string; items: NotificationItem[] }> {
  const order: DateGroupKey[] = ["today", "yesterday", "thisWeek", "older"];
  const buckets = new Map<DateGroupKey, NotificationItem[]>();

  for (const item of items) {
    const key = getDateGroup(item.created_at);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  return order
    .filter((key) => buckets.has(key))
    .map((key) => ({
      key,
      label: DATE_GROUP_LABELS[key],
      items: buckets.get(key)!,
    }));
}

export const NOTIFICATION_SETTING_SECTIONS: Array<{
  title: string;
  items: Array<{
    type: NotificationType;
    label: string;
    description: string;
    icon: string;
    iconBg: string;
  }>;
}> = [
  {
    title: "추천 알림",
    items: [
      {
        type: "recommendation",
        label: "맞춤 추천",
        description: "직업·관심 분야·경력·지역 기반 추천 알림",
        icon: "✨",
        iconBg: "#f3f0ff",
      },
      {
        type: "region",
        label: "지역 추천",
        description: "내 지역 신규 공고·교육·지원사업 등록 알림",
        icon: "📍",
        iconBg: "#eef4ff",
      },
      {
        type: "interest",
        label: "관심 분야 추천",
        description: "관심 분야 신규 활동 알림",
        icon: "🏷️",
        iconBg: "#ecfdf3",
      },
      {
        type: "career",
        label: "경력직 추천",
        description: "경력 직종 관련 신규 채용 알림",
        icon: "💼",
        iconBg: "#f3f4f6",
      },
      {
        type: "preference",
        label: "조건 기반 추천",
        description: "선호 조건에 맞는 신규 추천 알림",
        icon: "🎚️",
        iconBg: "#fff7ed",
      },
      {
        type: "hobby",
        label: "취미 추천",
        description: "관심 취미 활동 등록 알림",
        icon: "💗",
        iconBg: "#fdf2f8",
      },
    ],
  },
  {
    title: "지원사업",
    items: [
      {
        type: "support",
        label: "지원사업 공고",
        description: "신청 가능한 신규 지원사업 알림",
        icon: "🎁",
        iconBg: "#ecfdf3",
      },
    ],
  },
  {
    title: "마감 알림",
    items: [
      {
        type: "deadline_bookmark",
        label: "마감 임박",
        description: "찜한 항목의 마감 3일 전·1일 전 알림",
        icon: "⏰",
        iconBg: "#fef2f2",
      },
      {
        type: "deadline_recommend",
        label: "마감 임박 추천",
        description: "매칭도가 높은 마감 임박 추천 알림",
        icon: "⭐",
        iconBg: "#fffbeb",
      },
    ],
  },
];

export const NOTIFICATION_SETTING_TYPES = NOTIFICATION_SETTING_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.type)
);

/** @deprecated NOTIFICATION_SETTING_SECTIONS 사용 */
export const NOTIFICATION_SETTING_OPTIONS: Array<{
  type: NotificationType;
  label: string;
  description: string;
}> = NOTIFICATION_SETTING_SECTIONS.flatMap((section) =>
  section.items.map(({ type, label, description }) => ({ type, label, description }))
);
