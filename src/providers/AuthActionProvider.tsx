"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoginPromptDialog } from "@/components/auth/LoginPromptDialog";
import { hasDevSession, useDevAuthSession } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface AuthActionContextValue {
  requireAuth: (action: () => void | Promise<void>) => Promise<void>;
  promptLogin: () => void;
}

const AuthActionContext = createContext<AuthActionContextValue | null>(null);

export function AuthActionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const devMode = useDevAuthSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);

  const promptLogin = useCallback(() => setLoginOpen(true), []);

  const requireAuth = useCallback(
    async (action: () => void | Promise<void>) => {
      let authenticated = false;

      if (devMode) {
        authenticated = hasDevSession();
      } else {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        authenticated = Boolean(data.session);
      }

      if (!authenticated) {
        setPendingAction(() => action);
        setLoginOpen(true);
        return;
      }

      await action();
    },
    [devMode]
  );

  function handleLogin() {
    setLoginOpen(false);
    router.push("/login");
  }

  function handleClose() {
    setLoginOpen(false);
    setPendingAction(null);
  }

  return (
    <AuthActionContext.Provider value={{ requireAuth, promptLogin }}>
      {children}
      <LoginPromptDialog open={loginOpen} onClose={handleClose} onLogin={handleLogin} />
    </AuthActionContext.Provider>
  );
}

export function useAuthAction() {
  const ctx = useContext(AuthActionContext);
  if (!ctx) throw new Error("useAuthAction must be used within AuthActionProvider");
  return ctx;
}
