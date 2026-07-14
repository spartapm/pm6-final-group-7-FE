"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import { apiFetch } from "@/lib/api-client";
import type { MeResponse } from "@/lib/types";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

function isPostHogReady() {
  return Boolean(POSTHOG_KEY) && posthog.__loaded;
}

function isPublicAuthPath(pathname: string | null) {
  if (!pathname) return true;
  return pathname === "/login" || pathname.startsWith("/auth");
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isPostHogReady() || !pathname) return;
    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

function PostHogIdentify() {
  const pathname = usePathname();
  const publicAuth = isPublicAuthPath(pathname);
  const identifiedIdRef = useRef<string | null>(null);

  const { data: me, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    retry: false,
    staleTime: 60_000,
    enabled: !publicAuth,
  });

  useEffect(() => {
    if (!isPostHogReady()) return;

    if (publicAuth) {
      if (identifiedIdRef.current) {
        posthog.reset();
        identifiedIdRef.current = null;
      }
      return;
    }

    const profile = me?.profile;
    if (profile?.id) {
      if (identifiedIdRef.current !== profile.id) {
        posthog.identify(profile.id, {
          email: profile.email ?? undefined,
          nickname: profile.nickname,
        });
        identifiedIdRef.current = profile.id;
      }
      return;
    }

    if (isError && identifiedIdRef.current) {
      posthog.reset();
      identifiedIdRef.current = null;
    }
  }, [me, isError, publicAuth]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (posthog.__loaded) {
      setReady(true);
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      loaded: () => setReady(true),
    });
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <>
      {ready ? (
        <>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <PostHogIdentify />
        </>
      ) : null}
      {children}
    </>
  );
}
