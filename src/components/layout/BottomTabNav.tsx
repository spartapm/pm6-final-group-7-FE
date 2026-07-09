"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASSETS } from "@/lib/assets";

const TABS = [
  { href: "/home", label: "홈", icon: ASSETS.tabHome },
  { href: "/jobs", label: "일자리·지원", icon: ASSETS.tabJobs },
  { href: "/learning", label: "교육·취미", icon: ASSETS.tabLearning },
  { href: "/calendar", label: "캘린더", icon: ASSETS.tabCalendar },
  { href: "/my", label: "마이", icon: ASSETS.tabMy },
];

export function BottomTabNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-tab-nav fixed bottom-0 left-1/2 z-40 flex w-full max-w-[390px] -translate-x-1/2 flex-col border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex h-[var(--bottom-tab-nav-content)] items-end px-1 pb-1 pt-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-1 text-[11px] ${
                active ? "font-bold text-primary" : "font-normal text-text-tab-inactive"
              }`}
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-xl ${
                  active ? "bg-[#eef0fc]" : ""
                }`}
              >
                <Image
                  src={tab.icon}
                  alt=""
                  width={22}
                  height={22}
                  className={active ? "tab-nav-icon-active" : "tab-nav-icon-inactive"}
                />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
