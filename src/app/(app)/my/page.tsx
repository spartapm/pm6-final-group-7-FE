"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MyProfileCard } from "@/components/my/MyProfileCard";
import { setOnboardingFlow } from "@/lib/onboarding";
import { MyMenuItem } from "@/components/my/MyMenuItem";
import { MyMenuSection } from "@/components/my/MyMenuSection";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { openCustomerCenter } from "@/lib/customer-center";
import { apiFetch } from "@/lib/api-client";
import { clearDevSession, useDevAuthSession } from "@/lib/constants";
import {
  getGuestOnboarding,
  isGuestOnboardingComplete,
  normalizeGuestOnboarding,
} from "@/lib/guest-onboarding";
import { createClient } from "@/lib/supabase/client";
import type { MeResponse } from "@/lib/types";
import { useAuthAction } from "@/providers/AuthActionProvider";

export default function MyPage() {
  const router = useRouter();
  const devMode = useDevAuthSession();
  const { show: showToast } = useToast();
  const { requireAuth } = useAuthAction();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [guestOb, setGuestOb] = useState(() =>
    typeof window !== "undefined" ? getGuestOnboarding() : null
  );

  useEffect(() => {
    setGuestOb(getGuestOnboarding());
  }, []);

  const {
    data: me,
    isLoading: meLoading,
    isError: meError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    retry: false,
  });

  const isGuest = !meLoading && (meError || !me);
  const guestComplete = isGuest && isGuestOnboardingComplete(guestOb);
  const guestMe = useMemo((): MeResponse | undefined => {
    if (!guestComplete) return undefined;
    const onboarding = normalizeGuestOnboarding(guestOb);
    if (!onboarding) return undefined;
    return {
      profile: {
        id: "guest",
        nickname: "오육이",
        email: null,
        phone: null,
        status: "active",
      },
      onboarding,
      preferences: {},
      pending_apply_activity_id: null,
    };
  }, [guestComplete, guestOb]);

  const displayMe = me ?? guestMe;

  async function endSession() {
    if (devMode) {
      clearDevSession();
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  async function handleLogout() {
    await endSession();
    router.push("/");
  }

  async function handleWithdraw() {
    await apiFetch("/me/withdraw", { method: "POST" });
    await endSession();
    router.push("/");
  }

  function handlePersonalize() {
    void requireAuth(
      () => {
        setOnboardingFlow("settings");
        router.push("/onboarding/region");
      },
      {
        reason: "personalize",
        returnTo: "/my",
        intent: { type: "personalize" },
      }
    );
  }

  function handleProfile() {
    void requireAuth(() => router.push("/my/profile"), {
      reason: "profile",
      returnTo: "/my/profile",
      intent: { type: "navigate", path: "/my/profile" },
    });
  }

  return (
    <div className="min-h-full bg-[#f8f9fc] pb-6">
      <header className="gradient-header px-6 pb-28 pt-8">
        <h1 className="text-[22px] font-bold text-white">마이페이지</h1>
      </header>

      <div className="relative z-10 -mt-24 px-5">
        <MyProfileCard
          me={displayMe}
          isGuest={isGuest && !guestComplete}
          onPersonalize={handlePersonalize}
        />
      </div>

      <div className="mt-4 space-y-4 px-5">
        <MyMenuSection title="계정 관리">
          <MyMenuItem
            onClick={handleProfile}
            iconBg="#e8f0fe"
            icon={<span className="text-base">✏️</span>}
            title="프로필 수정"
            subtitle="이름, 나이대, 성별, 연락처"
          />
        </MyMenuSection>

        <MyMenuSection title="알림 · 지원">
          <MyMenuItem
            href={isGuest ? undefined : "/my/notifications-settings"}
            onClick={
              isGuest
                ? () =>
                    void requireAuth(() => router.push("/my/notifications-settings"), {
                      reason: "notification",
                      returnTo: "/my/notifications-settings",
                      intent: { type: "navigate", path: "/my/notifications-settings" },
                    })
                : undefined
            }
            iconBg="#fff3e8"
            icon={<span className="text-base">🔔</span>}
            title="알림 설정"
            subtitle="마감 알림, 추천 알림 관리"
          />
          <MyMenuItem
            href={isGuest ? undefined : "/my/font-size"}
            onClick={
              isGuest
                ? () =>
                    void requireAuth(() => router.push("/my/font-size"), {
                      reason: "generic",
                      returnTo: "/my/font-size",
                      intent: { type: "navigate", path: "/my/font-size" },
                    })
                : undefined
            }
            iconBg="#eef0ff"
            icon={<span className="text-xl font-bold text-primary">T</span>}
            title="글자 크기 설정"
            subtitle="읽기 편한 크기로 조절하세요"
            showDivider
          />
          <MyMenuItem
            onClick={() => {
              if (!openCustomerCenter()) {
                showToast("고객센터 연결에 실패했어요. 잠시 후 다시 시도해주세요.");
              }
            }}
            iconBg="#e8f8ef"
            icon={<span className="text-sm font-bold text-[#34a853]">?</span>}
            title="고객센터"
            subtitle="카카오톡 오픈채팅으로 문의하기"
            showDivider
          />
        </MyMenuSection>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <MyMenuItem
            onClick={() => setTermsOpen(true)}
            iconBg="#f3f4f6"
            icon={<span className="text-base">📄</span>}
            title="이용약관 · 개인정보처리방침"
            subtitle="서비스 이용약관 및 개인정보처리방침"
          />
        </section>

        {!isGuest && (
          <>
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <MyMenuItem
                onClick={() => setLogoutOpen(true)}
                iconBg="#ffecef"
                icon={<span className="text-base">🚪</span>}
                title="로그아웃"
                titleClassName="text-[#e8434f]"
              />
            </section>

            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4">
              <p className="text-[15px] text-[#9096a6]">버전 1.0.0</p>
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="text-[15px] font-bold text-[#e8434f]"
              >
                회원 탈퇴
              </button>
            </div>
          </>
        )}

        {isGuest && (
          <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
            <p className="text-[15px] text-[#9096a6]">버전 1.0.0</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={logoutOpen}
        emoji="🖐️"
        title="로그아웃 하시겠어요?"
        description="로그아웃 시 다시 로그인해야 서비스를 이용할 수 있어요."
        confirmLabel="예"
        cancelLabel="아니오"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />

      <ConfirmModal
        open={withdrawOpen}
        emoji="⚠️"
        title="정말 탈퇴하시겠어요?"
        description="탈퇴 시 회원정보와 개인화 설정이 모두 삭제되며 복구할 수 없습니다."
        confirmLabel="예"
        cancelLabel="아니오"
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawOpen(false)}
      />

      <BottomSheet open={termsOpen} title="이용약관 · 개인정보처리방침" onClose={() => setTermsOpen(false)}>
        <div className="space-y-5">
          <section className="rounded-2xl bg-[#f8f9fc] p-4">
            <h3 className="text-[16px] font-bold text-[#1c1c27]">서비스 이용약관</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6b7280]">
              오육이랑 서비스 이용과 관련한 기본적인 권리·의무 및 책임사항을 규정합니다. 본
              서비스는 5060 세대를 위한 일자리·지원사업·교육·취미활동 정보 제공을 목적으로
              합니다.
            </p>
          </section>
          <section className="rounded-2xl bg-[#f8f9fc] p-4">
            <h3 className="text-[16px] font-bold text-[#1c1c27]">개인정보처리방침</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6b7280]">
              회원님의 개인정보는 서비스 제공, 맞춤 추천, 알림 발송 목적으로만 사용되며 관련
              법령에 따라 안전하게 관리됩니다. 자세한 내용은 정식 오픈 시 공지됩니다.
            </p>
          </section>
        </div>
      </BottomSheet>
    </div>
  );
}
