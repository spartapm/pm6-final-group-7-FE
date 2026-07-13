import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingPath } from "@/lib/onboarding";
import type { MeResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** 온보딩 완료 여부에 따라 로그인 후 도착지 결정 (미완료 시 온보딩으로 직행) */
async function resolvePostLoginPath(token: string, requestedNext: string | null): Promise<string> {
  try {
    const meRes = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as MeResponse;
      if (!me.onboarding?.onboarding_completed_at) {
        return getOnboardingPath(me.onboarding?.onboarding_step ?? "region");
      }
    }
  } catch {
    // fall through to requested/default
  }
  return requestedNext ?? "/home";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      const eligibility = await fetch(`${API_BASE_URL}/auth/login-eligibility`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!eligibility.ok) {
        const body = await eligibility.json().catch(() => ({}));
        if (body.error === "rejoin_cooldown") {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=rejoin_cooldown`);
        }
      }

      const dest = await resolvePostLoginPath(data.session.access_token, next);
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }
  return NextResponse.redirect(`${origin}/login`);
}
