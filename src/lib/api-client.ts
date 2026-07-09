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

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: HeadersInit = {
    ...(hasBody && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

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
