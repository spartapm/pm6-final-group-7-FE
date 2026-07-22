/**
 * H-1: 교육/취미 — 성인(5060) 대상이 아닌 공고 제외.
 * 대상 필드가 비어 있으면 제외하지 않음(확정 불가 시 유지).
 */

const CHILD_PATTERNS = [
  /초등/,
  /중학생/,
  /고등학생/,
  /어린이/,
  /유아/,
  /영아/,
  /아동/,
  /청소년/,
  /키즈/,
  /kids?/i,
  /초1/,
  /초2/,
  /초3/,
  /초4/,
  /초5/,
  /초6/,
  /유치/,
  /미취학/,
  /초·중/,
  /초중고/,
  /초\.중/,
];

/** 성인·시니어 명시가 있으면 아동 키워드와 공존해도 통과 */
const ADULT_OVERRIDE = [/성인/, /시니어/, /중장년/, /5060/, /어르신/, /노인/, /만\s*19/, /만\s*2[0-9]/, /성인대상/];

function collectTargetText(activity: {
  title?: string;
  attributes?: Record<string, unknown> | null;
  raw_content?: Record<string, unknown> | null;
}): string {
  const a = activity.attributes ?? {};
  const raw = activity.raw_content ?? {};
  const parts = [
    a.target,
    a.target_audience,
    a.edcTrgetType,
    a.USE_TRGT,
    a.agelimit,
    a.expagerange,
    raw.edcTrgetType,
    raw.USE_TRGT,
    raw.agelimit,
    raw.expagerange,
    raw.target,
    typeof a.description === "string" ? a.description : "",
  ];
  return parts.filter((p): p is string => typeof p === "string" && p.trim().length > 0).join(" ");
}

/** true = 목록/추천에 노출 가능 */
export function isAdultOrientedActivity(activity: {
  category: string;
  title?: string;
  attributes?: Record<string, unknown> | null;
  raw_content?: Record<string, unknown> | null;
}): boolean {
  if (activity.category !== "education" && activity.category !== "hobby") return true;

  const text = collectTargetText(activity);
  if (!text.trim()) return true;

  if (ADULT_OVERRIDE.some((re) => re.test(text))) return true;
  if (CHILD_PATTERNS.some((re) => re.test(text))) return false;

  // 제목에만 아동 키워드가 있고 대상 필드가 비어 있지 않은 경우도 제목 보조 검사
  const title = activity.title ?? "";
  if (title && CHILD_PATTERNS.some((re) => re.test(title)) && !ADULT_OVERRIDE.some((re) => re.test(title))) {
    return false;
  }

  return true;
}
