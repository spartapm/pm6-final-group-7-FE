import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Activity } from "@/lib/types";

export interface LearningDetailRow {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
  red?: boolean;
  withPin?: boolean;
  withClock?: boolean;
}

export interface LearningTheme {
  accent: string;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  sectionBg: string;
  sectionText: string;
  categoryLabel: string;
}

// UI-01: 카테고리별 색상을 단일 브랜드 색(#5B6DBF)으로 통일 (캘린더 제외)
const UNIFIED_ACCENT = "#5b6dbf";
const UNIFIED_BADGE_BG = "#eef0fb";
const UNIFIED_BADGE_TEXT = "#4558b5";

export const EDUCATION_THEME: LearningTheme = {
  accent: UNIFIED_ACCENT,
  accentBorder: UNIFIED_ACCENT,
  badgeBg: UNIFIED_BADGE_BG,
  badgeText: UNIFIED_BADGE_TEXT,
  sectionBg: UNIFIED_BADGE_BG,
  sectionText: UNIFIED_BADGE_TEXT,
  categoryLabel: "교육",
};

export const HOBBY_THEME: LearningTheme = {
  accent: UNIFIED_ACCENT,
  accentBorder: UNIFIED_ACCENT,
  badgeBg: UNIFIED_BADGE_BG,
  badgeText: UNIFIED_BADGE_TEXT,
  sectionBg: UNIFIED_BADGE_BG,
  sectionText: UNIFIED_BADGE_TEXT,
  categoryLabel: "취미",
};

function attr(activity: Activity, key: string): string {
  const v = activity.attributes?.[key];
  return typeof v === "string" ? v : "";
}

function attrList(activity: Activity, key: string): string[] {
  const v = activity.attributes?.[key];
  if (Array.isArray(v)) return v.filter((item): item is string => typeof item === "string");
  if (typeof v === "string" && v) return [v];
  return [];
}

export function getLearningTheme(category: "education" | "hobby"): LearningTheme {
  return category === "education" ? EDUCATION_THEME : HOBBY_THEME;
}

export function getApplyPeriod(activity: Activity): string {
  if (activity.apply_start && activity.apply_end) {
    return `${format(parseISO(activity.apply_start), "M월 d일")} ~ ${format(parseISO(activity.apply_end), "M월 d일")}`;
  }
  if (activity.apply_end) {
    return `~ ${format(parseISO(activity.apply_end), "M월 d일")}`;
  }
  return "상시 접수";
}

export function getDday(applyEnd: string | null): number | null {
  if (!applyEnd) return null;
  const days = differenceInCalendarDays(parseISO(applyEnd), new Date());
  return days >= 0 ? days : null;
}

export function isUrgentDeadline(applyEnd: string | null): boolean {
  const dday = getDday(applyEnd);
  return dday !== null && dday <= 3;
}

export function getProgramRows(activity: Activity): LearningDetailRow[] {
  const isEducation = activity.category === "education";
  const rows: LearningDetailRow[] = [];
  const field = attr(activity, "field");
  const cost = attr(activity, "cost");
  const applyPeriod = getApplyPeriod(activity);

  if (field) rows.push({ label: "분야", value: field });
  if (activity.event_schedule) {
    rows.push({ label: "일정", value: activity.event_schedule, withClock: true });
  }
  if (activity.event_start) {
    rows.push({
      label: isEducation ? "교육시작일" : "활동시작일",
      value: format(parseISO(activity.event_start), "yyyy-MM-dd"),
    });
  }
  if (attr(activity, "capacity")) rows.push({ label: "정원", value: attr(activity, "capacity") });
  if (cost) {
    rows.push({
      label: "비용",
      value: cost,
      bold: true,
      green: cost.includes("무료"),
    });
  }
  if (activity.region_district) {
    rows.push({
      label: "장소",
      value: `서울 ${activity.region_district}`,
      withPin: true,
    });
  }
  if (attr(activity, "class_type")) {
    rows.push({ label: "수강방식", value: attr(activity, "class_type") });
  }
  if (attr(activity, "target")) rows.push({ label: "대상", value: attr(activity, "target") });
  if (attr(activity, "difficulty")) rows.push({ label: "난이도", value: attr(activity, "difficulty") });
  rows.push({ label: "신청기간", value: applyPeriod });
  if (activity.apply_end) {
    rows.push({
      label: "신청마감",
      value: format(parseISO(activity.apply_end), "yyyy-MM-dd"),
      red: true,
      bold: true,
    });
  }

  return rows;
}

export function getProgramDescription(activity: Activity): string {
  return (
    (activity.raw_content?.description as string | undefined) ??
    activity.ai_summary ??
    "상세 내용이 준비 중입니다."
  );
}

export function getProgramQualifications(activity: Activity): string {
  const explicit = attr(activity, "qualifications");
  if (explicit) return explicit;
  return "별도 자격 요건 없음";
}

export function getProgramTags(activity: Activity): string[] {
  const tags = attrList(activity, "tags");
  if (tags.length > 0) return tags;

  const fallback: string[] = [];
  const difficulty = attr(activity, "difficulty");
  const cost = attr(activity, "cost");
  if (difficulty) fallback.push(difficulty);
  if (cost.includes("무료")) fallback.push("무료");
  return fallback;
}
