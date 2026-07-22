"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/AppHeader";
import { NotificationDateGroup } from "@/components/notifications/NotificationDateGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api-client";
import { groupNotificationsByDate } from "@/lib/notification-display";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<{ items: NotificationItem[]; unread: number }>("/notifications"),
  });

  async function markRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const groups = data?.items ? groupNotificationsByDate(data.items) : [];

  return (
    <div className="min-h-screen bg-white">
      <AppHeader title="알림" backHref="/home" showNotification={false} />
      <div className="px-5 pb-8 pt-1">
        <p className="mb-3 text-[15px] font-semibold text-[#9a9aa5]">알림 메시지함</p>
        {data && data.unread > 0 && (
          <div className="mb-4 mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            읽지 않음 {data.unread}
          </div>
        )}
        {isLoading && <p className="py-12 text-center text-text-muted">불러오는 중...</p>}
        {!isLoading && (!data?.items || data.items.length === 0) && (
          <EmptyState
            title="새로운 알림이 아직 없어요."
            description="맞춤 추천이나 마감 알림이 여기에 표시됩니다."
          />
        )}
        {groups.map((group) => (
          <NotificationDateGroup
            key={group.key}
            label={group.label}
            items={group.items}
            onRead={markRead}
          />
        ))}
      </div>
    </div>
  );
}
