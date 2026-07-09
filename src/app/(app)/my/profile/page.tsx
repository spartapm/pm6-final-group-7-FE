"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  OnboardingChip,
  OnboardingNextButton,
  OnboardingSectionLabel,
} from "@/components/onboarding/OnboardingUI";
import { apiFetch } from "@/lib/api-client";
import { AGE_BANDS, CAREER_JOBS, CAREER_YEARS } from "@/lib/onboarding";
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
  const [careerJob, setCareerJob] = useState<string | null>(null);
  const [careerYears, setCareerYears] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
  });

  useEffect(() => {
    if (!me) return;
    setNickname(me.profile?.nickname ?? "");
    setEmail(me.profile?.email ?? "");
    setPhone(me.profile?.phone ?? "");
    setAgeBand(me.onboarding?.age_band ?? null);
    setGender(me.onboarding?.gender ?? null);
    setCareerJob(me.onboarding?.career_job_code ?? null);
    setCareerYears(me.onboarding?.career_years ?? null);
  }, [me]);

  const valid = Boolean(ageBand && gender && careerJob);

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
          career_job_code: careerJob,
          career_years: careerYears,
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
      <AppHeader title="프로필 수정" backHref="/my" />

      <div className="px-6 pt-2">
        <h1 className="text-[23px] font-bold text-[#1c1c27]">내 정보를 알려주세요</h1>
        <p className="mt-2 text-[16px] text-[#9096a6]">정확할수록 더 잘 맞는 정보를 찾아드려요</p>

        <div className="mt-6 space-y-6">
          <ProfileTextField
            label="이름"
            required="optional"
            value={nickname}
            onChange={setNickname}
            placeholder="이름"
          />

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

          <ProfileTextField
            label="이메일"
            required="optional"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="이메일 주소"
          />

          <ProfileTextField
            label="휴대폰 번호"
            required="optional"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="010-0000-0000"
          />

          <section>
            <p className="text-[17px] font-bold text-[#1c1c27]">경력 사항</p>
            <p className="mt-1 text-[15px] text-[#9096a6]">희망하는 일자리 추천에 활용돼요</p>

            <div className="mt-4">
              <OnboardingSectionLabel title="주요 경력 직종" required />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {CAREER_JOBS.map((j) => (
                  <OnboardingChip
                    key={j.code}
                    label={j.label}
                    selected={careerJob === j.code}
                    onClick={() => setCareerJob(j.code)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <OnboardingSectionLabel title="경력 기간" required="optional" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {CAREER_YEARS.map((o) => (
                  <OnboardingChip
                    key={o}
                    label={o}
                    selected={careerYears === o}
                    onClick={() => setCareerYears(o)}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <OnboardingNextButton
        disabled={!valid}
        loading={loading}
        label="저장하기"
        onClick={handleSave}
      />
    </div>
  );
}
