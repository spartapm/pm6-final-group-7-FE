import type { Activity } from "@/lib/types";

function attr(activity: Activity, key: string): string {
  const v = activity.attributes?.[key];
  return typeof v === "string" ? v : "";
}

export interface SupportDetailRow {
  label: string;
  value: string;
}

export function getSupportSummaryRows(activity: Activity): SupportDetailRow[] {
  const rows: SupportDetailRow[] = [];
  const field = attr(activity, "support_field");
  const type = attr(activity, "support_type");

  if (field) rows.push({ label: "지원 분야", value: field });
  if (type) rows.push({ label: "지원 유형", value: type });
  if (activity.org_name) rows.push({ label: "소관 기관", value: activity.org_name });
  if (attr(activity, "support_amount_text")) {
    rows.push({ label: "지원 내용", value: attr(activity, "support_amount_text") });
  }
  return rows;
}

export function getSupportTarget(activity: Activity): string {
  return attr(activity, "target") || "지원 대상 정보를 확인해 주세요.";
}

export function getSupportApplyMethod(activity: Activity): string {
  return attr(activity, "apply_method") || "온라인 또는 주민센터·담당 기관 문의";
}

export function getSupportDocuments(activity: Activity): string {
  return attr(activity, "documents") || "신청 시 필요 서류는 담당 기관 안내를 확인해 주세요.";
}

export function getSupportDescription(activity: Activity): string {
  return (
    (activity.raw_content?.description as string | undefined) ??
    activity.ai_summary ??
    "지원 내용을 확인 중입니다."
  );
}

export function getSupportTags(activity: Activity): string[] {
  const tags = activity.attributes?.tags;
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === "string");
  const field = attr(activity, "support_field");
  return field ? [field] : [];
}

export function isAlwaysOpenSupport(activity: Activity): boolean {
  return activity.attributes?.is_always_open === true || !activity.apply_end;
}

export function getSupportApplyPeriod(activity: Activity): string {
  if (isAlwaysOpenSupport(activity)) return "상시 접수";
  if (activity.apply_end) return `~ ${activity.apply_end.replace(/-/g, ".")} 까지`;
  return "접수 기간 확인 필요";
}
