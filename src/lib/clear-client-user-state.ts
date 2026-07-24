import type { QueryClient } from "@tanstack/react-query";
import { clearDevSession } from "@/lib/constants";

/**
 * 회원 탈퇴 등 계정 종료 시 브라우저에 남아있는 사용자 관련 상태를 모두 제거한다.
 * (게스트 온보딩, 확인함, 찜 tip, 로그인 복귀, 신청대기, 탭 기억, 세션 토큰 등)
 */
const CLIENT_STATE_KEYS = [
  "oyukirang-guest-onboarding",
  "oyukirang-dev-token",
  "ovViewed",
  "ovLikeTipDismissed",
  "oyukirang-like-tip-dismissed",
  "oyukirang-like-tip-seen",
  "oyukirang-jobs-list-state",
  "oyukirang-learning-list-state",
  "oyukirang-pending-auth-action",
  "oyukirang-guest-pending-apply",
  "onboarding_flow",
  "obMaxPct",
  "oyukirang-jobs-tab",
  "oyukirang-learning-tab",
  "oyukirang-post-onboarding-next",
];

function shouldWipeStorageKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (CLIENT_STATE_KEYS.includes(key)) return true;
  if (lower.includes("returnto")) return true;
  if (key.startsWith("oyukirang")) return true;
  if (key.startsWith("ov") || key.startsWith("ob")) return true;
  if (key.startsWith("sb-")) return true;
  if (lower.includes("supabase")) return true;
  return false;
}

function wipeBrowserStores() {
  if (typeof window === "undefined") return;
  try {
    clearDevSession();
  } catch {
    // document 접근 실패 무시
  }
  try {
    for (const store of [localStorage, sessionStorage]) {
      const staleKeys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && shouldWipeStorageKey(key)) staleKeys.push(key);
      }
      staleKeys.forEach((key) => store.removeItem(key));
    }
  } catch {
    // storage 접근 실패는 무시
  }
}

export function clearClientUserState(queryClient?: QueryClient) {
  wipeBrowserStores();
  queryClient?.clear();
}
