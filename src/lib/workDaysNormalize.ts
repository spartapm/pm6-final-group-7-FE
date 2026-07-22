/**
 * H-3: 근무일수 원문을 UI 칩 값으로 정규화.
 * 반환: "주 1~2일" | "주 3~4일" | "주 5일" | null(판별 불가)
 */

export type WorkDaysChip = "주 1~2일" | "주 3~4일" | "주 5일";

export function normalizeWorkDays(raw: string | null | undefined): WorkDaysChip | null {
  if (!raw || !raw.trim()) return null;
  const t = raw.replace(/\s+/g, " ").trim();

  if (/주\s*1\s*~\s*2|주\s*1-2|주\s*1,?\s*2일|주\s*1일|주\s*2일|주1~2|주1-2/.test(t)) {
    return "주 1~2일";
  }
  if (/주\s*3\s*~\s*4|주\s*3-4|주\s*3,?\s*4일|주\s*3일|주\s*4일|주3~4|주3-4/.test(t)) {
    return "주 3~4일";
  }
  if (/주\s*5|주5|월\s*~\s*금|월~금|월-금|평일\s*5|5일\s*근무|주\s*5일/.test(t)) {
    return "주 5일";
  }

  // "주 N일" 숫자만
  const m = t.match(/주\s*([1-5])\s*일/);
  if (m) {
    const n = Number(m[1]);
    if (n <= 2) return "주 1~2일";
    if (n <= 4) return "주 3~4일";
    return "주 5일";
  }

  return null;
}

/** attributes에 work_days_normalized 를 채워 넣기 위한 헬퍼 */
export function withNormalizedWorkDays<T extends { attributes?: Record<string, unknown> | null }>(
  activity: T
): T {
  const attrs = { ...(activity.attributes ?? {}) };
  const raw =
    (typeof attrs.work_days === "string" && attrs.work_days) ||
    (typeof attrs.work_days_raw === "string" && attrs.work_days_raw) ||
    "";
  const normalized = normalizeWorkDays(raw);
  if (normalized) {
    attrs.work_days_normalized = normalized;
    // 필터 매칭용: 원문이 칩과 다르면 정규화 값도 병기
    if (!normalizeWorkDays(typeof attrs.work_days === "string" ? attrs.work_days : "")) {
      attrs.work_days_chip = normalized;
    }
  }
  return { ...activity, attributes: attrs };
}
