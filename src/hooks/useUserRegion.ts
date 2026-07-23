"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { getGuestOnboarding } from "@/lib/guest-onboarding";
import { REGION_CHANGED_EVENT } from "@/lib/region-events";
import type { MeResponse } from "@/lib/types";

export { notifyRegionChanged, REGION_CHANGED_EVENT } from "@/lib/region-events";

/** 로그인 me 또는 게스트 온보딩의 거주 시·도/구·군 */
export function useUserRegion() {
  const queryClient = useQueryClient();
  const [guestTick, setGuestTick] = useState(0);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/me"),
    retry: false,
  });

  useEffect(() => {
    const onRegionChanged = () => {
      setGuestTick((t) => t + 1);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    };
    window.addEventListener(REGION_CHANGED_EVENT, onRegionChanged);
    return () => window.removeEventListener(REGION_CHANGED_EVENT, onRegionChanged);
  }, [queryClient]);

  return useMemo(() => {
    const guest = typeof window !== "undefined" ? getGuestOnboarding() : null;
    const regionCity =
      me?.onboarding?.region_city || guest?.region_city || "서울특별시";
    const regionDistrict =
      me?.onboarding?.region_district || guest?.region_district || null;
    return { regionCity, regionDistrict };
    // guestTick: 게스트 localStorage 지역 변경 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, guestTick]);
}

export function activitiesQueryUrl(
  category: string,
  regionCity: string,
  regionDistrict: string | null,
  selectedDistricts: string[]
): string {
  const params = new URLSearchParams({ category });
  params.set("region_city", regionCity);
  if (selectedDistricts.length === 1) {
    params.set("district", selectedDistricts[0]!);
  } else if (regionDistrict) {
    params.set("preferred_district", regionDistrict);
  }
  return `/activities?${params.toString()}`;
}
