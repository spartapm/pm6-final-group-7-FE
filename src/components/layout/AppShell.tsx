"use client";

import { usePathname } from "next/navigation";
import { BottomTabNav } from "@/components/layout/BottomTabNav";

const HIDE_TAB_NAV_PREFIXES = [
  "/my/profile",
  "/my/settings/complete",
  "/my/notifications-settings",
  "/my/font-size",
];

function shouldHideTabNav(pathname: string): boolean {
  return HIDE_TAB_NAV_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTabNav = shouldHideTabNav(pathname);

  return (
    <>
      <div className={hideTabNav ? "min-h-dvh" : "app-main-with-tab-nav"}>{children}</div>
      {!hideTabNav && <BottomTabNav />}
    </>
  );
}
