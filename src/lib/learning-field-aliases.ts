/**
 * UI 필터 칩 ↔ 소스 attributes.field 매핑 (2차 분야 태그 / 관광·문화 소스 필드명 차이)
 */

/** 교육 탭 칩 → 데이터에 실제로 쓰이는 동의어 */
export const EDUCATION_FIELD_ALIASES: Record<string, string[]> = {
  "디지털·AI": ["디지털·AI", "디지털/AI", "IT·디지털"],
  직업역량: ["직업역량", "직업·자격", "직업"],
  자격증: ["자격증", "직업·자격"],
  "요리·생활": ["요리·생활", "생활·교양", "생활교양", "생활"],
  "건강·복지": ["건강·복지", "보건·복지"],
  미디어: ["미디어"],
  언어: ["언어", "외국어"],
};

/** 취미 탭 칩 → 관광/문화/평생학습 소스 필드 */
export const HOBBY_FIELD_ALIASES: Record<string, string[]> = {
  "미술·공예": ["미술·공예", "체험·배움", "예술·취미"],
  "운동·건강": ["운동·건강", "운동·야외활동"],
  "음악·공연": ["음악·공연", "공연·전시·행사"],
  여행: ["여행", "나들이·체험", "문화·관람"],
  "봉사·나눔": ["봉사·나눔"],
  "사진·영상": ["사진·영상"],
};

const HOBBY_CHIP_FIELDS = new Set(Object.keys(HOBBY_FIELD_ALIASES));

/** 취미「기타」: 칩/별칭에 없는 분야 */
export function isHobbyOtherField(primary: string, secondary: string): boolean {
  const known = new Set<string>();
  for (const aliases of Object.values(HOBBY_FIELD_ALIASES)) {
    for (const a of aliases) known.add(a);
  }
  for (const chip of HOBBY_CHIP_FIELDS) known.add(chip);
  if (!primary && !secondary) return true;
  return !known.has(primary) && !known.has(secondary);
}

export function educationFieldMatches(chip: string, ...candidates: string[]): boolean {
  const aliases = EDUCATION_FIELD_ALIASES[chip] ?? [chip];
  return candidates.some((c) => c && aliases.includes(c));
}

export function hobbyFieldMatches(chip: string, ...candidates: string[]): boolean {
  if (chip === "기타") {
    return isHobbyOtherField(candidates[0] ?? "", candidates[1] ?? "");
  }
  const aliases = HOBBY_FIELD_ALIASES[chip] ?? [chip];
  return candidates.some((c) => c && aliases.includes(c));
}
