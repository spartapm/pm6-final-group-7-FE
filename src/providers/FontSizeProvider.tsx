"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { MeResponse } from "@/lib/types";

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    retry: false,
  });

  useEffect(() => {
    const size = me?.preferences?.font_size ?? "default";
    document.documentElement.dataset.fontSize = size;
  }, [me?.preferences?.font_size]);

  return <>{children}</>;
}
