import type { Activity } from "@/lib/types";

function rawPhone(activity: Activity): string | null {
  const fromAttr = activity.attributes?.phone;
  if (typeof fromAttr === "string" && fromAttr.trim()) return fromAttr.trim();
  const fromRaw = activity.raw_content?.phone;
  if (typeof fromRaw === "string" && fromRaw.trim()) return fromRaw.trim();
  return null;
}

/** Resolve external apply URL with source-specific fallbacks (AP-01: 공고별 상세 URL 우선) */
export function resolveApplyUrl(activity: Activity): string | null {
  if (activity.apply_url) return activity.apply_url;

  // 지원사업(보조금24): 상세조회URL → 서비스ID 기반 상세 페이지
  if (activity.category === "support" || activity.external_source === "gov24") {
    const detail = activity.raw_content?.list as Record<string, unknown> | undefined;
    const detailUrl = detail?.["상세조회URL"] ?? detail?.["온라인신청사이트URL"];
    if (typeof detailUrl === "string" && detailUrl) return detailUrl;
    const serviceId = detail?.["서비스ID"];
    if (typeof serviceId === "string" && serviceId) {
      return `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${serviceId}`;
    }
  }

  if (activity.external_source === "senuri") {
    const phone = rawPhone(activity);
    if (phone) {
      const digits = phone.replace(/[^\d+]/g, "");
      return digits ? `tel:${digits}` : null;
    }
  }

  // 서울일자리포털은 공고별 고정 URL이 없어(포털 통합검색) 해당 공고 검색으로 연결
  if (activity.external_source === "seoul_job_portal") {
    const q = encodeURIComponent(`${activity.title} ${activity.org_name} 채용`);
    return `https://search.naver.com/search.naver?query=${q}`;
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
