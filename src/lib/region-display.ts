import type { Activity } from "@/lib/types";

/** 시·도 표기용 짧은 이름 (특별시/광역시 등 접미사 제거) */
export function shortCityLabel(city: string | null | undefined): string {
  if (!city?.trim()) return "";
  return city.trim().replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "");
}

/**
 * 공고 카드·상세용 지역 표기.
 * 시·도 값이 없으면 서울 등으로 가정하지 않고, 구·군만 또는 null을 반환한다.
 */
export function formatActivityRegion(activity: Activity): string | null {
  if (!activity.region_district) {
    return activity.category === "support" ? "전국" : null;
  }
  const fromAttr =
    typeof activity.attributes?.region_city === "string"
      ? activity.attributes.region_city
      : null;
  const cityShort = shortCityLabel(activity.region_city || fromAttr);
  if (cityShort) return `${cityShort} ${activity.region_district}`;
  return activity.region_district;
}

/** 헤더 등: 시·도 라벨 + 구·군 (시·도 없으면 구·군만) */
export function formatUserRegionLabel(
  cityLabel: string | null | undefined,
  district: string | null | undefined
): string | null {
  if (!district) return null;
  const city = shortCityLabel(cityLabel);
  return city ? `${city} ${district}` : district;
}
