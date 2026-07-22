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
    districts: [
      "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시",
      "안산시", "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시",
      "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시", "김포시", "화성시",
      "광주시", "양주시", "포천시", "여주시",
      "장안구", "권선구", "팔달구", "영통구",
      "수정구", "중원구", "분당구",
      "만안구", "동안구",
      "상록구", "단원구",
      "덕양구", "일산동구", "일산서구",
      "처인구", "기흥구", "수지구",
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
