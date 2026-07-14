import type { Activity } from "@/lib/types";

function rawPhone(activity: Activity): string | null {
  const fromAttr = activity.attributes?.phone;
  if (typeof fromAttr === "string" && fromAttr.trim()) return fromAttr.trim();
  const fromRaw = activity.raw_content?.phone;
  if (typeof fromRaw === "string" && fromRaw.trim()) return fromRaw.trim();
  return null;
}

function firstUrl(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//i.test(c.trim())) return c.trim();
  }
  return null;
}

/** Resolve external apply URL with source-specific fallbacks (AP-01: 공고별 상세 URL 우선) */
export function resolveApplyUrl(activity: Activity): string | null {
  if (activity.apply_url) return activity.apply_url;

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

  // 서울일자리: 포털 검색 화면 (제목 복사는 openApplyUrl에서 처리)
  if (activity.external_source === "seoul_job_portal") {
    const q = encodeURIComponent(activity.title);
    return `https://job.seoul.go.kr/www/joboffer/JobOfferSrch.do?reQuery=${q}`;
  }

  // 관광공사 / 문화행사 / 50플러스 — attributes·raw의 URL 우선순위
  if (activity.external_source === "tour_api") {
    const a = activity.attributes ?? {};
    return (
      firstUrl(a.booking_url, a.reservation_url, a.event_homepage, a.homepage) ??
      (typeof a.phone === "string" && a.phone ? `tel:${String(a.phone).replace(/[^\d+]/g, "")}` : null)
    );
  }

  if (activity.external_source === "seoul_cultural_event") {
    const a = activity.attributes ?? {};
    return firstUrl(a.org_link, a.homepage, activity.raw_content?.ORG_LINK, activity.raw_content?.HMPG_ADDR);
  }

  if (activity.external_source === "seoul_fifty_plus") {
    return firstUrl(activity.attributes?.apply_url, activity.raw_content?.CR_URL);
  }

  if (activity.external_source === "lifelong_learning") {
    const phone = rawPhone(activity);
    if (phone) {
      const digits = phone.replace(/[^\d+]/g, "");
      return digits ? `tel:${digits}` : null;
    }
  }

  return null;
}

export function getApplyButtonLabel(activity: Activity): string {
  if (activity.external_source === "seoul_job_portal") {
    return "서울일자리포털에서 확인하기";
  }
  const url = resolveApplyUrl(activity);
  if (!url) {
    if (activity.external_source === "lifelong_learning" || activity.external_source === "tour_api") {
      return "운영기관 확인 필요";
    }
    return "신청 방법 확인";
  }
  if (url.startsWith("tel:")) return "전화로 문의하기";
  return "신청하러 가기";
}

export type OpenApplyResult = { opened: boolean; copiedTitle: boolean };

/** 외부 신청 URL 오픈. 서울일자리는 제목을 클립보드에 복사한 뒤 포털로 이동 */
export async function openApplyUrl(activity: Activity): Promise<OpenApplyResult> {
  const url = resolveApplyUrl(activity);
  if (!url) return { opened: false, copiedTitle: false };

  let copiedTitle = false;
  if (activity.external_source === "seoul_job_portal" && typeof navigator !== "undefined") {
    try {
      await navigator.clipboard.writeText(activity.title);
      copiedTitle = true;
    } catch {
      copiedTitle = false;
    }
  }

  window.open(url, url.startsWith("tel:") ? "_self" : "_blank", "noopener,noreferrer");
  return { opened: true, copiedTitle };
}
