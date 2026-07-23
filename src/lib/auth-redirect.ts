/** 로그인 후 복귀 경로 — open redirect 방지 */
export function safeNextPath(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/** 온보딩 미완료로 온보딩에 들어가기 전, 로그인 유도 시 저장해 둔 복귀 경로 */
const POST_ONBOARDING_NEXT_KEY = "oyukirang-post-onboarding-next";

/**
 * 로그인 유도 후 온보딩을 거치게 될 때 호출.
 * 온보딩 경로(/onboarding…)·홈은 저장하지 않는다.
 */
export function savePostOnboardingNext(path: string | null | undefined) {
  if (typeof window === "undefined") return;
  const safe = safeNextPath(path, "");
  if (!safe || safe === "/home" || safe.startsWith("/onboarding") || safe.startsWith("/auth")) {
    return;
  }
  try {
    sessionStorage.setItem(POST_ONBOARDING_NEXT_KEY, safe);
  } catch {
    // storage 접근 실패 무시
  }
}

/** 온보딩 완료「시작하기」에서 소비. 없으면 fallback */
export function consumePostOnboardingNext(fallback = "/home"): string {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(POST_ONBOARDING_NEXT_KEY);
    sessionStorage.removeItem(POST_ONBOARDING_NEXT_KEY);
    return safeNextPath(raw, fallback);
  } catch {
    return fallback;
  }
}
