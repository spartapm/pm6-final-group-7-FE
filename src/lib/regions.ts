/**
 * H-5: 서비스 지원 시·도 8개 + 구/시 목록
 * 온보딩·필터·추천에서 공통 사용
 */

export interface RegionCity {
  /** UI 칩 라벨 */
  label: string;
  /** 저장값 region_city */
  code: string;
  /** 구/군/시 목록 (2뎁스) */
  districts: string[];
}

export const SUPPORTED_CITIES: RegionCity[] = [
  {
    label: "서울",
    code: "서울특별시",
    districts: [
      "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
      "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
      "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
    ],
  },
  {
    label: "경기",
    code: "경기도",
    /** 필터·온보딩: 시만 노출 (구는 GU_TO_SI로 시에 귀속) */
    districts: [
      "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시",
      "안산시", "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시",
      "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시", "김포시", "화성시",
      "광주시", "양주시", "포천시", "여주시",
    ],
  },
  {
    label: "인천",
    code: "인천광역시",
    districts: ["중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"],
  },
  {
    label: "부산",
    code: "부산광역시",
    districts: [
      "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구",
      "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군",
    ],
  },
  {
    label: "대구",
    code: "대구광역시",
    districts: ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"],
  },
  {
    label: "광주",
    code: "광주광역시",
    districts: ["동구", "서구", "남구", "북구", "광산구"],
  },
  {
    label: "대전",
    code: "대전광역시",
    districts: ["동구", "중구", "서구", "유성구", "대덕구"],
  },
  {
    label: "울산",
    code: "울산광역시",
    districts: ["중구", "남구", "동구", "북구", "울주군"],
  },
];

export const SUPPORTED_CITY_LABELS = SUPPORTED_CITIES.map((c) => c.label);

/** 하위 호환: 서울 구만 (기존 SEOUL_DISTRICTS import 대체용) */
export const SEOUL_DISTRICTS = SUPPORTED_CITIES[0]!.districts;

export function getCityByLabel(label: string): RegionCity | undefined {
  return SUPPORTED_CITIES.find((c) => c.label === label || c.code === label);
}

export function getCityByCode(code: string): RegionCity | undefined {
  return SUPPORTED_CITIES.find((c) => c.code === code || c.label === code);
}

export function getDistrictsForCity(cityLabelOrCode: string): string[] {
  return getCityByLabel(cityLabelOrCode)?.districts ?? getCityByCode(cityLabelOrCode)?.districts ?? [];
}

/** 필터용: 사용자 거주 시·도의 구 목록 + 전국 확장 시 전체 구 합집합 */
export function getAllSupportedDistricts(): string[] {
  const set = new Set<string>();
  for (const c of SUPPORTED_CITIES) {
    for (const d of c.districts) set.add(d);
  }
  return [...set];
}

export function isSupportedCityLabel(label: string): boolean {
  return SUPPORTED_CITY_LABELS.includes(label);
}

/** 경기 구 → 시 (목록 정렬·필터 매칭용) */
export const GYEONGGI_GU_TO_SI: Record<string, string> = {
  장안구: "수원시",
  권선구: "수원시",
  팔달구: "수원시",
  영통구: "수원시",
  수정구: "성남시",
  중원구: "성남시",
  분당구: "성남시",
  만안구: "안양시",
  동안구: "안양시",
  상록구: "안산시",
  단원구: "안산시",
  덕양구: "고양시",
  일산동구: "고양시",
  일산서구: "고양시",
  처인구: "용인시",
  기흥구: "용인시",
  수지구: "용인시",
};

export function isGyeonggiCity(cityLabelOrCode: string | null | undefined): boolean {
  if (!cityLabelOrCode) return false;
  return cityLabelOrCode === "경기도" || cityLabelOrCode === "경기";
}

/** 경기: 구명을 시로 정규화. 그 외·이미 시면 그대로 */
export function normalizeRegionDistrict(
  district: string | null | undefined,
  regionCity?: string | null
): string | null {
  if (!district?.trim()) return null;
  const d = district.trim();
  if (regionCity && !isGyeonggiCity(regionCity)) return d;
  // regionCity 없어도 경기 구 맵에 있으면 시로
  return GYEONGGI_GU_TO_SI[d] ?? d;
}

/** 필터 선택값(시)과 공고 region_district(시 또는 구) 일치 */
export function districtMatchesFilter(
  activityDistrict: string | null | undefined,
  selected: string,
  regionCity?: string | null
): boolean {
  if (!activityDistrict) return false;
  if (activityDistrict === selected) return true;
  if (!isGyeonggiCity(regionCity) && regionCity != null) return false;
  const normalized = normalizeRegionDistrict(activityDistrict, regionCity ?? "경기도");
  return normalized === selected;
}

/** DB/쿼리용: 선택 지역과 매칭되는 region_district 값 목록 (경기 시 → 시+하위구) */
export function districtFilterValues(
  selected: string,
  regionCity?: string | null
): string[] {
  const values = new Set<string>([selected]);
  if (isGyeonggiCity(regionCity) || Object.values(GYEONGGI_GU_TO_SI).includes(selected)) {
    for (const [gu, si] of Object.entries(GYEONGGI_GU_TO_SI)) {
      if (si === selected) values.add(gu);
    }
  }
  return [...values];
}

