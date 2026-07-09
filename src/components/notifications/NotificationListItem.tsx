"use client";

import { useRouter } from "next/navigation";
import {
  formatRelativeTime,
  getDisplayTitle,
  getNotificationEmoji,
} from "@/lib/notification-display";
import type { NotificationItem } from "@/lib/types";

interface NotificationListItemProps {
  notification: NotificationItem;
  onRead: (id: string) => void;
}

export function NotificationListItem({ notification, onRead }: NotificationListItemProps) {
  const router = useRouter();
  const unread = !notification.read_at;
  const emoji = getNotificationEmoji(notification.type);
  const title = getDisplayTitle(notification);

  function handleClick() {
    if (unread) onRead(notification.id);
    if (notification.activity_id) {
      router.push(`/activities/${notification.activity_id}`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-3 rounded-2xl px-1 py-3 text-left transition-colors ${
        unread ? "bg-primary/5" : "bg-transparent"
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-[15px] font-bold leading-snug ${unread ? "text-text-primary" : "text-text-secondary"}`}>
            {title}
          </span>
          {unread && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
          )}
        </span>
        <span className="mt-1 block text-sm text-text-secondary line-clamp-2">{notification.body}</span>
        <span className="mt-1.5 block text-xs text-text-muted">
          {formatRelativeTime(notification.created_at)}
        </span>
      </span>
    </button>
  );
}
