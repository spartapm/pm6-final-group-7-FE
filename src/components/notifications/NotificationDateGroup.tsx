"use client";

import { NotificationListItem } from "./NotificationListItem";
import type { NotificationItem } from "@/lib/types";

interface NotificationDateGroupProps {
  label: string;
  items: NotificationItem[];
  onRead: (id: string) => void;
}

export function NotificationDateGroup({ label, items, onRead }: NotificationDateGroupProps) {
  return (
    <section className="mb-2">
      <h2 className="mb-1 px-1 text-sm font-bold text-text-muted">{label}</h2>
      <div className="divide-y divide-gray-100">
        {items.map((n) => (
          <NotificationListItem key={n.id} notification={n} onRead={onRead} />
        ))}
      </div>
    </section>
  );
}
