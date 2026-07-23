import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth-redirect";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

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

      // 온보딩 완료 여부 판단은 /auth/continue 에서 일괄 처리 (게스트 온보딩 동기화 포함)
      const dest = safeNextPath(next, "/home");
      return NextResponse.redirect(
        `${origin}/auth/continue?next=${encodeURIComponent(dest)}`
      );
    }
  }
  return NextResponse.redirect(`${origin}/login`);
}
