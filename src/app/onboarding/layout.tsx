import type { Metadata } from "next";

export const metadata: Metadata = { title: "온보딩 | 오육이랑" };

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white">{children}</div>;
}
