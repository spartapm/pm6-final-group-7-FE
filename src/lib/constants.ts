export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const DEV_AUTH_COOKIE = "oyukirang-dev-auth";
export const DEV_AUTH_TOKEN = "dev-local-token";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isDevSkipAuth() {
  return process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";
}

export function useDevAuthSession() {
  return !isSupabaseConfigured() || isDevSkipAuth();
}

export function enableDevSession() {
  document.cookie = `${DEV_AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}`;
  localStorage.setItem("oyukirang-dev-token", DEV_AUTH_TOKEN);
}

export function clearDevSession() {
  document.cookie = `${DEV_AUTH_COOKIE}=; path=/; max-age=0`;
  localStorage.removeItem("oyukirang-dev-token");
}

export function hasDevSession() {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${DEV_AUTH_COOKIE}=1`);
}
