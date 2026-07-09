import type { Activity } from "@/lib/types";

export async function shareActivity(activity: Activity) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/activities/${activity.id}`
      : `/activities/${activity.id}`;
  const text = `${activity.title}\n${activity.org_name}`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: activity.title, text, url });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "clipboard";
  }

  return "unsupported";
}
