"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, devLogin } from "@/lib/api-client";
import { enableDevSession, useDevAuthSession } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { syncGuestOnboarding } from "@/lib/guest-onboarding";
import { getOnboardingPath } from "@/lib/onboarding";
import { safeNextPath } from "@/lib/auth-redirect";
import type { MeResponse } from "@/lib/types";

/** M-22: 이메일/비밀번호 로그인 */
function EmailLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const devMode = useDevAuthSession();

  async function afterLogin() {
    const requestedNext = safeNextPath(searchParams.get("next"));
    try {
      await syncGuestOnboarding();
      const me = await apiFetch<MeResponse>("/me");
      if (!me.onboarding?.onboarding_completed_at) {
        if (requestedNext.startsWith("/onboarding")) {
          router.push(requestedNext);
          return;
        }
        router.push(getOnboardingPath(me.onboarding?.onboarding_step ?? "region"));
        return;
      }
    } catch {
      // fall through
    }
    router.push(requestedNext);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      if (devMode) {
        // 개발 환경: 이메일 입력과 무관하게 개발 세션으로 로그인
        await devLogin();
        enableDevSession();
        await afterLogin();
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      await afterLogin();
    } catch {
      setErrorMessage("로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-7 pt-6">
      <label className="text-[15px] font-bold text-text-primary" htmlFor="login-email">
        이메일
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com"
        className="mt-2 rounded-2xl border border-gray-200 px-4 py-3.5 text-[16px] outline-none focus:border-primary"
      />

      <label className="mt-5 text-[15px] font-bold text-text-primary" htmlFor="login-password">
        비밀번호
      </label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호 입력"
        className="mt-2 rounded-2xl border border-gray-200 px-4 py-3.5 text-[16px] outline-none focus:border-primary"
      />

      {errorMessage && (
        <p className="mt-4 rounded-2xl bg-[#fff0f0] px-4 py-3 text-center text-[14px] font-bold text-[#e8434f]">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-8 w-full rounded-2xl bg-primary py-4 text-[17px] font-bold text-white disabled:opacity-60"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      <p className="mt-6 text-center text-[13px] text-text-muted">
        로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>
    </form>
  );
}

export default function EmailLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/login" className="text-xl font-bold text-text-primary" aria-label="뒤로">
          ←
        </Link>
        <h1 className="text-lg font-bold text-text-primary">이메일로 로그인</h1>
      </header>
      <Suspense fallback={null}>
        <EmailLoginForm />
      </Suspense>
    </div>
  );
}
