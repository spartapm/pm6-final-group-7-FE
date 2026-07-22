import type { Activity } from "@/lib/types";

const SEOUL_JOB_LIST_URL = "https://job.seoul.go.kr/hmpg/rmim/rsmg/rsmgListPage.do";

function rawPhone(activity: Activity): string | null {
  const fromAttr = activity.attributes?.phone;
  if (typeof fromAttr === "string" && fromAttr.trim()) return fromAttr.trim();
  const fromRaw = activity.raw_content?.phone;
  if (typeof fromRaw === "string" && fromRaw.trim()) return fromRaw.trim();
  return null;
}

function firstUrl(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string") {
      const extracted = extractHttpUrl(c);
      if (extracted) return extracted;
    }
  }
  return null;
}

/** 텍스트/HTML에 섞인 http(s) URL 추출 */
function extractHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const match = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0]!.replace(/[),.]+$/, "") : null;
}

function resolveTourApplyUrl(activity: Activity): string | null {
  const a = activity.attributes ?? {};
  const raw = activity.raw_content ?? {};
  const resolved = firstUrl(
    a.booking_url,
    raw.bookingplace,
    a.reservation_url,
    raw.reservationurl,
    raw.reservation,
    a.event_homepage,
    raw.eventhomepage,
    a.homepage,
    raw.homepage,
    activity.apply_url
  );
  if (resolved) return resolved;

  // M-18: 상세 홈페이지가 비어도 콘텐츠 ID로 관광공사 상세 페이지 연결
  const contentId =
    activity.external_id ||
    (typeof raw.contentid === "string" || typeof raw.contentid === "number"
      ? String(raw.contentid)
      : null);
  if (contentId) {
    return `https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=${encodeURIComponent(contentId)}`;
  }

  if (typeof a.phone === "string" && a.phone) {
    return `tel:${String(a.phone).replace(/[^\d+]/g, "")}`;
  }
  return null;
}

/** Resolve external apply URL with source-specific fallbacks (AP-01: 공고별 상세 URL 우선) */
export function resolveApplyUrl(activity: Activity): string | null {
  // 관광공사: attributes 우선순위가 apply_url(홈페이지 등)보다 앞섬
  if (activity.external_source === "tour_api") {
    return resolveTourApplyUrl(activity);
  }

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

  // 서울일자리: 통합검색 URL + 제목 쿼리 (H-7)
  if (activity.external_source === "seoul_job_portal") {
    const keyword = encodeURIComponent(activity.title.trim());
    // 통합검색 화면 — 제목 붙여넣기/쿼리 모두 가능하도록 search 파라미터 포함
    return `${SEOUL_JOB_LIST_URL}?searchMode=Y&srcKeyword=${keyword}`;
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
    return "지원하러 가기";
  }
  const url = resolveApplyUrl(activity);
  if (!url) {
    if (activity.external_source === "lifelong_learning") {
      return "운영기관 확인 필요";
    }
    return "신청 방법 확인";
  }
  if (url.startsWith("tel:")) return "전화로 문의하기";
  return activity.category === "job" ? "지원하러 가기" : "신청하러 가기";
}

const SOURCE_SITE_NAMES: Record<string, string> = {
  seoul_job_portal: "서울일자리포털",
  gov24: "정부24",
  seoul_fifty_plus: "서울시50플러스포털",
  lifelong_learning: "서울시평생학습포털",
  seoul_cultural_event: "서울문화포털",
  tour_api: "한국관광공사",
  senuri: "시니어 일자리(세누리)",
};

/** 신청 이동 확인 팝업에 표시할 사이트명 */
export function getApplySiteName(activity: Activity): string {
  const source = activity.external_source ?? "";
  if (SOURCE_SITE_NAMES[source]) return SOURCE_SITE_NAMES[source];
  const url = resolveApplyUrl(activity);
  if (url && /^https?:\/\//i.test(url)) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return activity.org_name;
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
