"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ASSETS } from "@/lib/assets";
import { apiFetch } from "@/lib/api-client";
import type { NotificationItem } from "@/lib/types";

interface AppHeaderProps {
  nickname?: string;
  district?: string | null;
  showNotification?: boolean;
  title?: string;
  backHref?: string;
  showShare?: boolean;
}

export function AppHeader({
  nickname = "회원",
  district,
  showNotification = true,
  title,
  backHref,
  showShare = false,
}: AppHeaderProps) {
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<{ items: NotificationItem[]; unread: number }>("/notifications"),
    enabled: showNotification && !title,
  });

  const unread = notifications?.unread ?? 0;

  if (title) {
    return (
      <header className="flex items-center gap-3 bg-white px-5 py-4">
        {backHref && (
          <Link href={backHref} className="text-xl font-bold text-text-primary" aria-label="뒤로">
            ←
          </Link>
        )}
        <h1 className="flex-1 text-lg font-bold text-text-primary">{title}</h1>
        {showShare && (
          <button type="button" aria-label="공유">
            <Image src={ASSETS.iconShare} alt="" width={22} height={22} />
          </button>
        )}
      </header>
    );
  }

  return (
    <header className="gradient-header px-5 pb-6 pt-10 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold">안녕하세요 {nickname}님! 👋</p>
          {district && (
            <p className="mt-1.5 flex items-center gap-1 text-[15px] text-[#e6e9fa]">
              <Image src={ASSETS.iconLocationPin} alt="" width={14} height={18} className="opacity-90" />
              서울 {district}
            </p>
          )}
        </div>
        {showNotification && (
          <Link
            href="/notifications"
            className="relative mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/25"
            aria-label={unread > 0 ? `알림 ${unread}건 읽지 않음` : "알림"}
          >
            <Image src={ASSETS.iconBell} alt="" width={18} height={15} />
            {unread > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff3b30]" />
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
