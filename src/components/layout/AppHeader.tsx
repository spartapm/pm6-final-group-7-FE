"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ASSETS } from "@/lib/assets";
import { apiFetch } from "@/lib/api-client";
import type { NotificationItem } from "@/lib/types";
import { useAuthAction } from "@/providers/AuthActionProvider";

interface AppHeaderProps {
  nickname?: string;
  district?: string | null;
  cityLabel?: string | null;
  showNotification?: boolean;
  title?: string;
  backHref?: string;
  onBack?: () => void;
  showShare?: boolean;
  isGuest?: boolean;
}

export function AppHeader({
  nickname = "회원",
  district,
  cityLabel,
  showNotification = true,
  title,
  backHref,
  onBack,
  showShare = false,
  isGuest = false,
}: AppHeaderProps) {
  const { promptLogin } = useAuthAction();
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<{ items: NotificationItem[]; unread: number }>("/notifications"),
    enabled: showNotification && !title && !isGuest,
    retry: false,
  });

  const unread = notifications?.unread ?? 0;
  const regionText = district
    ? `${(cityLabel ?? "서울").replace(/(특별시|광역시|특별자치시|도)$/, "")} ${district}`
    : null;

  if (title) {
    return (
      <header className="flex items-center gap-3 bg-white px-5 py-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-xl font-bold text-text-primary"
            aria-label="뒤로"
          >
            ←
          </button>
        ) : (
          backHref && (
            <Link href={backHref} className="text-xl font-bold text-text-primary" aria-label="뒤로">
              ←
            </Link>
          )
        )}
        <h1 className="flex-1 text-lg font-bold text-text-primary">{title}</h1>
        {showShare && (
          <button type="button" aria-label="공유">
            <Image src={ASSETS.iconShare} alt="" width={22} height={22} unoptimized />
          </button>
        )}
      </header>
    );
  }

  const bellInner = (
    <>
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/25">
        <Image
          src={ASSETS.iconBell}
          alt=""
          width={22}
          height={22}
          unoptimized
          className="brightness-0 invert"
        />
        {unread > 0 && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff3b30]" />
        )}
      </span>
      <span className="text-[14px] text-white">알림</span>
    </>
  );

  return (
    <header className="gradient-header px-5 pb-6 pt-10 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold">안녕하세요 {nickname}님! 👋</p>
          {regionText && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[16px] text-[#edebfc]">
              <Image
                src={ASSETS.iconLocationPin}
                alt=""
                width={14}
                height={16}
                unoptimized
                className="brightness-0 invert opacity-90"
              />
              {regionText}
            </p>
          )}
        </div>
        {showNotification &&
          (isGuest ? (
            <button
              type="button"
              className="relative mt-0.5 flex flex-col items-center gap-0.5"
              aria-label="알림"
              onClick={() =>
                promptLogin({
                  reason: "notification",
                  returnTo: "/notifications",
                  intent: { type: "navigate", path: "/notifications" },
                })
              }
            >
              {bellInner}
            </button>
          ) : (
            <Link
              href="/notifications"
              className="relative mt-0.5 flex flex-col items-center gap-0.5"
              aria-label={unread > 0 ? `알림 ${unread}건 읽지 않음` : "알림"}
            >
              {bellInner}
            </Link>
          ))}
      </div>
    </header>
  );
}
