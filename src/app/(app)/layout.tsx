import { AppShell } from "@/components/layout/AppShell";
import { PendingApplyHandler } from "@/components/activity/PendingApplyHandler";
import { PendingAuthActionHandler } from "@/components/auth/PendingAuthActionHandler";
import { NetworkBanner } from "@/components/ui/NetworkBanner";
import { AuthActionProvider } from "@/providers/AuthActionProvider";
import { FontSizeProvider } from "@/providers/FontSizeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FontSizeProvider>
      <AuthActionProvider>
        <NetworkBanner />
        <AppShell>{children}</AppShell>
        <PendingApplyHandler />
        <PendingAuthActionHandler />
      </AuthActionProvider>
    </FontSizeProvider>
  );
}
