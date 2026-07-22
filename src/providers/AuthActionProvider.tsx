"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LoginPromptDialog,
  type LoginPromptReason,
} from "@/components/auth/LoginPromptDialog";
import { hasDevSession, useDevAuthSession } from "@/lib/constants";
import {
  clearPendingAuthAction,
  setPendingAuthAction,
  type PendingAuthAction,
} from "@/lib/pending-auth-action";
import { createClient } from "@/lib/supabase/client";

export type { LoginPromptReason };

interface RequireAuthOptions {
  reason?: LoginPromptReason;
  returnTo?: string;
  /** 로그인 후 이어서 실행할 동작 (비로그인 시에만 저장) */
  intent?: PendingAuthAction;
}

interface AuthActionContextValue {
  requireAuth: (
    action: () => void | Promise<void>,
    options?: RequireAuthOptions
  ) => Promise<void>;
  promptLogin: (options?: RequireAuthOptions) => void;
  isAuthenticated: () => Promise<boolean>;
}

const AuthActionContext = createContext<AuthActionContextValue | null>(null);

function safeReturnPath(path: string | undefined, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export function AuthActionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const devMode = useDevAuthSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [reason, setReason] = useState<LoginPromptReason>("generic");
  const [returnTo, setReturnTo] = useState<string>("/home");

  const checkAuth = useCallback(async () => {
    if (devMode) return hasDevSession();
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }, [devMode]);

  const promptLogin = useCallback(
    (options?: RequireAuthOptions) => {
      if (options?.intent) {
        setPendingAuthAction(options.intent);
      }
      setReason(options?.reason ?? "generic");
      setReturnTo(safeReturnPath(options?.returnTo, pathname || "/home"));
      setLoginOpen(true);
    },
    [pathname]
  );

  const requireAuth = useCallback(
    async (action: () => void | Promise<void>, options?: RequireAuthOptions) => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        promptLogin(options);
        return;
      }
      await action();
    },
    [checkAuth, promptLogin]
  );

  function handleLogin() {
    setLoginOpen(false);
    const next = encodeURIComponent(returnTo);
    router.push(`/login?next=${next}`);
  }

  function handleClose() {
    setLoginOpen(false);
    // 로그인 취소 시 이어가기 intent 폐기
    clearPendingAuthAction();
  }

  return (
    <AuthActionContext.Provider
      value={{ requireAuth, promptLogin, isAuthenticated: checkAuth }}
    >
      {children}
      <LoginPromptDialog
        open={loginOpen}
        reason={reason}
        onClose={handleClose}
        onLogin={handleLogin}
      />
    </AuthActionContext.Provider>
  );
}

export function useAuthAction() {
  const ctx = useContext(AuthActionContext);
  if (!ctx) throw new Error("useAuthAction must be used within AuthActionProvider");
  return ctx;
}
