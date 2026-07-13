"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  OnboardingChip,
  OnboardingNextButton,
  OnboardingSectionLabel,
} from "@/components/onboarding/OnboardingUI";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { apiFetch } from "@/lib/api-client";
import { AGE_BANDS } from "@/lib/onboarding";
import type { MeResponse } from "@/lib/types";

function ProfileTextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  required?: boolean | "optional";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <section>
      <OnboardingSectionLabel title={label} required={required} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-xl border border-[#e5e7eb] px-4 py-3.5 text-[16px] text-[#1c1c27] placeholder:text-[#b7bac4] outline-none focus:border-primary"
      />
    </section>
  );
}

/** SCR-018 프로필 수정 (Figma 1229:175) */
export default function MyProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ageBand, setAgeBand] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<string>("");
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    if (!me) return;
    const nn = me.profile?.nickname ?? "";
    const em = me.profile?.email ?? "";
    const ph = me.profile?.phone ?? "";
    const ab = me.onboarding?.age_band ?? null;
    const gd = me.onboarding?.gender ?? null;
    setNickname(nn);
    setEmail(em);
    setPhone(ph);
    setAgeBand(ab);
    setGender(gd);
    setInitial(JSON.stringify({ nn, em, ph, ab, gd }));
  }, [me]);

  // UI-06: 작성 중 이탈 감지용 dirty 상태
  const isDirty = useMemo(
    () =>
      initial !== "" &&
      JSON.stringify({ nn: nickname, em: email, ph: phone, ab: ageBand, gd: gender }) !== initial,
    [initial, nickname, email, phone, ageBand, gender]
  );

  // UI-04: 이름은 입력 시 trim 후 2~10자
  const trimmedName = nickname.trim();
  const nameValid = trimmedName.length === 0 || (trimmedName.length >= 2 && trimmedName.length <= 10);

  // UI-05: 이메일·휴대폰 형식 검증(입력 시)
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const emailValid = trimmedEmail.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const phoneValid = trimmedPhone.length === 0 || /^01[016789]-?\d{3,4}-?\d{4}$/.test(trimmedPhone);

  const valid = Boolean(ageBand && gender && nameValid && emailValid && phoneValid);

  // UI-06: 새로고침/창 닫기 시 경고
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function handleBack() {
    if (isDirty) {
      setLeaveOpen(true);
      return;
    }
    router.push("/my");
  }

  async function handleSave() {
    if (!valid) return;
    setLoading(true);
    try {
      await apiFetch("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          nickname: nickname.trim() || undefined,
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      await apiFetch("/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          age_band: ageBand,
          gender,
        }),
      });
      await apiFetch("/recommendations/refresh", { method: "POST", body: JSON.stringify({}) });
      await queryClient.invalidateQueries();
      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-white pb-28">
      <AppHeader title="프로필 수정" onBack={handleBack} />

      <div className="px-6 pt-2">
        <h1 className="text-[23px] font-bold text-[#1c1c27]">내 정보를 알려주세요</h1>
        <p className="mt-2 text-[16px] text-[#9096a6]">정확할수록 더 잘 맞는 정보를 찾아드려요</p>

        <div className="mt-6 space-y-6">
          <div>
            <ProfileTextField
              label="이름"
              required="optional"
              value={nickname}
              onChange={(v) => setNickname(v.slice(0, 10))}
              placeholder="이름 (2~10자)"
            />
            {trimmedName.length > 0 && !nameValid && (
              <p className="mt-1.5 text-[13px] text-[#e1483e]">이름은 2~10자로 입력해주세요</p>
            )}
          </div>

          <section>
            <OnboardingSectionLabel title="나이대" required />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {AGE_BANDS.map((o) => (
                <OnboardingChip key={o} label={o} selected={ageBand === o} onClick={() => setAgeBand(o)} />
              ))}
            </div>
          </section>

          <section>
            <OnboardingSectionLabel title="성별" required />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["남성", "여성"].map((o) => (
                <OnboardingChip key={o} label={o} selected={gender === o} onClick={() => setGender(o)} />
              ))}
            </div>
          </section>

          <div>
            <ProfileTextField
              label="이메일"
              required="optional"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="이메일 주소"
            />
            {trimmedEmail.length > 0 && !emailValid && (
              <p className="mt-1.5 text-[13px] text-[#e1483e]">올바른 이메일 형식을 입력해주세요</p>
            )}
          </div>

          <div>
            <ProfileTextField
              label="휴대폰 번호"
              required="optional"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="010-0000-0000"
            />
            {trimmedPhone.length > 0 && !phoneValid && (
              <p className="mt-1.5 text-[13px] text-[#e1483e]">
                올바른 휴대폰 번호를 입력해주세요
              </p>
            )}
          </div>
        </div>
      </div>

      <OnboardingNextButton
        disabled={!valid}
        loading={loading}
        label="저장하기"
        onClick={handleSave}
      />

      <ConfirmModal
        open={leaveOpen}
        title="작성 중인 내용이 있어요"
        description="저장하지 않고 나가면 변경한 내용이 사라져요."
        confirmLabel="나가기"
        cancelLabel="계속 작성"
        onConfirm={() => {
          setLeaveOpen(false);
          router.push("/my");
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}
