import { API_BASE_URL, DEV_AUTH_TOKEN, hasDevSession, useDevAuthSession } from "./constants";
import { createClient } from "./supabase/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

async function getAccessToken(): Promise<string | null> {
  if (useDevAuthSession()) {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oyukirang-dev-token") ?? (hasDevSession() ? DEV_AUTH_TOKEN : null);
    }
    return hasDevSession() ? DEV_AUTH_TOKEN : null;
  }
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function shouldRetryResponse(response: Response): boolean {
  if (response.status === 502 || response.status === 503) return true;
  // Render free tier cold start: text/plain "Not Found" (x-render-routing: no-server)
  if (response.status === 404) {
    const type = response.headers.get("content-type") ?? "";
    return type.includes("text/plain");
  }
  return false;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** 네트워크 오류(일시적 끊김/오프라인 복귀 직후 등) 시 1회 자동 재시도 (AP-04) */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    await sleep(1500);
    return await fetch(url, init);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: HeadersInit = {
    ...(hasBody && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE_URL}${path}`;
  let response = await fetchWithRetry(url, { ...options, headers });
  for (let attempt = 0; attempt < 2 && shouldRetryResponse(response); attempt += 1) {
    await sleep(1500 * (attempt + 1));
    response = await fetchWithRetry(url, { ...options, headers });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error ?? "unknown", body.message ?? "요청에 실패했습니다.");
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export async function devLogin() {
  const res = await fetch(`${API_BASE_URL}/auth/dev-login`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? "unknown", data.message ?? "로그인에 실패했습니다.");
  }
  localStorage.setItem("oyukirang-dev-token", data.access_token);
  return data;
}
