/** 확인함(viewed) — localStorage.ovViewed */

const STORAGE_KEY = "ovViewed";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota */
  }
}

export function getViewedIds(): string[] {
  return readIds();
}

export function isViewed(activityId: string): boolean {
  return readIds().includes(activityId);
}

export function markViewed(activityId: string): void {
  const ids = readIds();
  if (ids.includes(activityId)) return;
  writeIds([activityId, ...ids]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ov-viewed-changed"));
  }
}

export function useViewedSet(): Set<string> {
  // lightweight hook-free helper for components that re-render on navigation
  return new Set(readIds());
}
