import type { Activity } from "@/lib/types";

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

export interface JobDetailRow {
  label: string;
  value: string;
  bold?: boolean;
  withPin?: boolean;
}

export function getJobSummaryRows(activity: Activity): JobDetailRow[] {
  const jobType = attr(activity, "job_type") || attr(activity, "industry");
  const rows: JobDetailRow[] = [];

  if (jobType) rows.push({ label: "직종", value: jobType });
  if (attr(activity, "employment_type")) {
    rows.push({ label: "근무형태", value: attr(activity, "employment_type") });
  }
  if (attr(activity, "salary")) {
    rows.push({ label: "급여", value: attr(activity, "salary"), bold: true });
  }
  if (attr(activity, "work_days")) {
    rows.push({ label: "근무일수", value: attr(activity, "work_days") });
  }
  if (activity.region_district) {
    rows.push({
      label: "근무위치",
      value: `서울 ${activity.region_district}`,
      withPin: true,
    });
  }

  return rows;
}

export function getJobDescription(activity: Activity): string {
  return (
    (activity.raw_content?.description as string | undefined) ??
    activity.ai_summary ??
    "상세 내용이 준비 중입니다."
  );
}

export function getJobQualifications(activity: Activity): string {
  const explicit = attr(activity, "qualifications");
  if (explicit) return explicit;

  const parts = [
    attr(activity, "career_requirement"),
    attr(activity, "age_requirement"),
    attr(activity, "health_requirement"),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "별도 자격 요건 없음";
}

export function getJobBenefits(activity: Activity): string[] {
  const benefits = attrList(activity, "benefits");
  if (benefits.length > 0) return benefits;

  const insurance = attr(activity, "insurance");
  if (insurance) return [insurance];
  return [];
}

export function getJobTags(activity: Activity): string[] {
  const tags = attrList(activity, "tags");
  if (tags.length > 0) return tags;

  const fallback: string[] = [];
  if (attr(activity, "short_term")) fallback.push("단기 가능");
  if (attr(activity, "career_requirement")?.includes("무관")) fallback.push("경력 무관");
  return fallback;
}
