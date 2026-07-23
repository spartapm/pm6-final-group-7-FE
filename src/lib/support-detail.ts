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
  return attr(activity, "target");
}

export function getSupportApplyMethod(activity: Activity): string {
  return attr(activity, "apply_method");
}

export function getSupportDocuments(activity: Activity): string {
  return attr(activity, "documents");
}

export function getSupportDescription(activity: Activity): string {
  return (activity.raw_content?.description as string | undefined)?.trim() ?? "";
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
  if (activity.apply_start) return `${activity.apply_start.replace(/-/g, ".")} 부터`;
  return "";
}
