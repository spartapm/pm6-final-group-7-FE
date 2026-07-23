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
  const addressFull = attr(activity, "address_full");

  if (jobType) rows.push({ label: "직종", value: jobType });
  if (attr(activity, "employment_type")) {
    rows.push({ label: "근무형태", value: attr(activity, "employment_type") });
  }
  if (attr(activity, "salary")) {
    rows.push({ label: "급여", value: attr(activity, "salary"), bold: true });
  }
  if (attr(activity, "work_days")) {
    rows.push({ label: "근무일수·시간", value: attr(activity, "work_days") });
  }
  if (addressFull || activity.region_district) {
    const fromAttr =
      typeof activity.attributes?.region_city === "string"
        ? activity.attributes.region_city
        : null;
    const cityShort = (activity.region_city?.trim() || fromAttr?.trim() || "").replace(
      /(특별시|광역시|특별자치시|특별자치도|도)$/,
      ""
    );
    const districtLabel = activity.region_district
      ? cityShort
        ? `${cityShort} ${activity.region_district}`
        : activity.region_district
      : "";
    rows.push({
      label: "근무위치",
      value: addressFull || districtLabel,
      withPin: true,
    });
  }

  return rows;
}

export function getJobDescription(activity: Activity): string {
  const raw = (activity.raw_content?.description as string | undefined) ?? "";
  const cleaned = raw.replace(/<[^>]+>/g, "").replace(/\r\n/g, "\n").trim();
  return cleaned || activity.ai_summary || "상세 내용이 준비 중입니다.";
}

/** 빈 항목은 제외. 전부 비면 null → UI에서 안내 문구 표시 */
export function getJobQualificationRows(activity: Activity): JobDetailRow[] {
  const rows: JobDetailRow[] = [];
  const push = (label: string, value: string) => {
    if (value.trim()) rows.push({ label, value: value.trim() });
  };
  push("경력 조건", attr(activity, "career_requirement"));
  push("학력 조건", attr(activity, "education_requirement"));
  push("모집인원", attr(activity, "recruit_count") ? `${attr(activity, "recruit_count")}명` : "");
  push("전형 방법", attr(activity, "selection_method"));
  push("접수 방법", attr(activity, "apply_method"));
  push("제출 서류", attr(activity, "required_documents"));
  push("연령 조건", attr(activity, "age_requirement"));
  return rows;
}

export function getJobQualifications(activity: Activity): string {
  const rows = getJobQualificationRows(activity);
  if (rows.length === 0) return "";
  return rows.map((r) => `${r.label}: ${r.value}`).join(" / ");
}

export function getJobBenefits(activity: Activity): string[] {
  const benefits = attrList(activity, "benefits");
  if (benefits.length > 0) return benefits.filter(Boolean);

  const items: string[] = [];
  if (attr(activity, "insurance")) items.push(attr(activity, "insurance"));
  if (attr(activity, "retirement_pay")) items.push(`퇴직금: ${attr(activity, "retirement_pay")}`);
  return items;
}

export function getJobTags(activity: Activity): string[] {
  const tags = attrList(activity, "tags").filter(Boolean);
  if (tags.length > 0) return tags.slice(0, 3);

  const fallback: string[] = [];
  if (attr(activity, "career_requirement")?.includes("무관")) fallback.push("경력무관");
  if (attr(activity, "employment_type")) {
    const emp = attr(activity, "employment_type");
    if (emp.includes("계약")) fallback.push("계약직");
    else if (emp.includes("시간")) fallback.push("시간제");
  }
  return fallback.slice(0, 3);
}
