"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  NotificationSettingRow,
  NotificationSettingsSectionCard,
} from "@/components/notifications/NotificationSettingRow";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api-client";
import {
  NOTIFICATION_SETTING_SECTIONS,
  NOTIFICATION_SETTING_TYPES,
} from "@/lib/notification-display";
import type { MeResponse, NotificationSettings, NotificationType } from "@/lib/types";

type PushPermission = "default" | "granted" | "denied" | "unsupported";

/** SCR-020 알림 설정 (Figma 1222:131) */
export default function NotificationSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermission>("default");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    if (me?.preferences?.notification_settings) {
      setSettings(me.preferences.notification_settings);
    }
  }, [me]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPushPermission("unsupported");
      return;
    }
    setPushPermission(Notification.permission as PushPermission);
  }, []);

  function isEnabled(type: NotificationType): boolean {
    return settings[type] !== false;
  }

  function toggle(type: NotificationType) {
    setSettings((prev) => {
      const enabled = prev[type] !== false;
      return { ...prev, [type]: !enabled };
    });
  }

  async function handlePushPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showToast("이 브라우저는 푸시 알림을 지원하지 않아요.");
      return;
    }

    if (Notification.permission === "granted") {
      showToast("이미 알림 권한이 허용되어 있어요.");
      setPushPermission("granted");
      return;
    }

    const result = await Notification.requestPermission();
    setPushPermission(result as PushPermission);

    if (result === "granted") {
      showToast("푸시 알림 권한이 허용되었어요.");
    } else if (result === "denied") {
      showToast("알림 권한이 거부되었어요. 브라우저 설정에서 변경할 수 있어요.");
    }
  }

  const pushLabel =
    pushPermission === "granted"
      ? "허용됨"
      : pushPermission === "denied"
        ? "거부됨"
        : pushPermission === "unsupported"
          ? "미지원"
          : "권한 요청";

  async function handleSave() {
    setLoading(true);
    try {
      const notification_settings = NOTIFICATION_SETTING_TYPES.reduce(
        (acc, type) => {
          acc[type] = isEnabled(type);
          return acc;
        },
        {} as Record<NotificationType, boolean>
      );
      await apiFetch("/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ notification_settings }),
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      showToast("알림 설정을 저장했어요.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#f8f9fc] pb-28">
      <header className="flex items-center gap-3 bg-white px-5 py-4">
        <Link href="/my" className="text-xl font-bold text-[#1c1c27]" aria-label="뒤로">
          ←
        </Link>
        <h1 className="text-[20px] font-bold text-[#1c1c27]">알림 설정</h1>
      </header>

      <div className="space-y-4 px-5 py-5">
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3f0ff] text-xl">
              🔔
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold text-[#1c1c27]">푸시 알림 권한</p>
              <p className="mt-0.5 text-[15px] leading-snug text-[#9096a6]">
                알림 권한이 없으면
                <br />
                일부 알림을 받지 못해요
              </p>
            </div>
            {pushPermission !== "granted" && pushPermission !== "unsupported" ? (
              <button
                type="button"
                onClick={handlePushPermission}
                className="shrink-0 rounded-full bg-[#fff3e8] px-4 py-2 text-[14px] font-bold text-[#e8973e]"
              >
                {pushLabel}
              </button>
            ) : (
              <span className="shrink-0 rounded-full bg-[#e8f8ef] px-4 py-2 text-[14px] font-bold text-[#34a853]">
                {pushLabel}
              </span>
            )}
          </div>
        </section>

        {NOTIFICATION_SETTING_SECTIONS.map((section) => (
          <NotificationSettingsSectionCard key={section.title} title={section.title}>
            {section.items.map((item, index) => (
              <NotificationSettingRow
                key={item.type}
                icon={item.icon}
                iconBg={item.iconBg}
                label={item.label}
                description={item.description}
                checked={isEnabled(item.type)}
                onChange={() => toggle(item.type)}
                showDivider={index > 0}
              />
            ))}
          </NotificationSettingsSectionCard>
        ))}

        <div className="rounded-2xl bg-[#eef0ff] px-5 py-4">
          <p className="text-[16px] font-bold leading-relaxed text-[#6b6fd6]">
            💡 마감 임박 알림을 켜두시면 찜한 공고 마감일이 3일 이내일 때 알려드려요.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 border-t border-gray-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="w-full rounded-2xl bg-primary py-4 text-[18px] font-bold text-white disabled:opacity-50"
        >
          {loading ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}
