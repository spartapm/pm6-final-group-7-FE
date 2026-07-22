/** M-13: 일정/시간 표기 정규화 — 잘못된 시각(예: 54시)은 "사이트 내 확인 필요" 처리 */

/** "HH:mm" 또는 "H시" 형태에서 시(hour) 값이 유효한지 검사 */
function hasInvalidHour(raw: string): boolean {
  // 콜론 표기: 54:00, 25:30 등
  const colonMatches = raw.matchAll(/(\d{1,2})\s*:\s*(\d{2})/g);
  for (const m of colonMatches) {
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour > 24 || minute > 59) return true;
  }
  // "시" 표기: 54시 등
  const hourMatches = raw.matchAll(/(\d{1,3})\s*시/g);
  for (const m of hourMatches) {
    if (Number(m[1]) > 24) return true;
  }
  return false;
}

export function formatScheduleDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (hasInvalidHour(trimmed)) return "사이트 내 확인 필요";

  // 시간 2개가 구분자 없이/모호하게 붙은 경우 ~로 연결 (예: "10:00 12:00", "10:00-12:00")
  const twoTimes = trimmed.match(/^(\d{1,2}:\d{2})\s*[-–~]?\s*(\d{1,2}:\d{2})$/);
  if (twoTimes) {
    return `${twoTimes[1]} ~ ${twoTimes[2]}`;
  }

  // 이미 ~가 있으면 좌우 공백만 정리
  return trimmed.replace(/\s*~\s*/g, " ~ ");
}
