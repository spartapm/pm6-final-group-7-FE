import type { Activity } from "@/lib/types";

function rawPhone(activity: Activity): string | null {
  const fromAttr = activity.attributes?.phone;
  if (typeof fromAttr === "string" && fromAttr.trim()) return fromAttr.trim();
  const fromRaw = activity.raw_content?.phone;
  if (typeof fromRaw === "string" && fromRaw.trim()) return fromRaw.trim();
  return null;
}

/** Resolve external apply URL with source-specific fallbacks */
export function resolveApplyUrl(activity: Activity): string | null {
  if (activity.apply_url) return activity.apply_url;

  if (activity.external_source === "seoul_job_portal") {
    const q = encodeURIComponent(`${activity.title} ${activity.org_name}`);
    return `https://www.gov.kr/search?query=${q}`;
  }

  if (activity.external_source === "senuri") {
    const phone = rawPhone(activity);
    if (phone) {
      const digits = phone.replace(/[^\d+]/g, "");
      return digits ? `tel:${digits}` : null;
    }
  }

  if (activity.category === "support") {
    const detail = activity.raw_content?.list as Record<string, unknown> | undefined;
    const detailUrl = detail?.["상세조회URL"];
    if (typeof detailUrl === "string" && detailUrl) return detailUrl;
  }

  return null;
}

export function getApplyButtonLabel(activity: Activity): string {
  const url = resolveApplyUrl(activity);
  if (!url) return "신청 방법 확인";
  if (url.startsWith("tel:")) return "전화 문의하기";
  if (activity.category === "support") return "신청하러 가기";
  return "신청하러 가기";
}

export function openApplyUrl(activity: Activity): boolean {
  const url = resolveApplyUrl(activity);
  if (!url) return false;
  window.open(url, url.startsWith("tel:") ? "_self" : "_blank", "noopener,noreferrer");
  return true;
}
