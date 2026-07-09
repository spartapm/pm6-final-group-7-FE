export type ActivityCategory = "job" | "support" | "education" | "hobby";

export interface Activity {
  id: string;
  category: ActivityCategory;
  external_source?: string;
  title: string;
  org_name: string;
  region_district: string | null;
  apply_start: string | null;
  apply_end: string | null;
  event_start: string | null;
  event_schedule: string | null;
  apply_url: string | null;
  status: string;
  attributes: Record<string, unknown>;
  raw_content: Record<string, unknown>;
  ai_summary?: string | null;
  bookmarked?: boolean;
  applied?: boolean;
}

export interface RecommendationItem {
  activity: Activity;
  reasons: string[];
}

export interface UserOnboarding {
  region_city: string;
  region_district: string | null;
  age_band: string | null;
  gender: string | null;
  career_job_code: string | null;
  career_years: string | null;
  education: string | null;
  interest_directions: string[];
  job_preferences: Record<string, unknown>;
  hobby_preferences: Record<string, unknown>;
  learning_preferences: Record<string, unknown>;
  important_job_info: Record<string, unknown>;
  important_hobby_info: Record<string, unknown>;
  important_learning_info: Record<string, unknown>;
  onboarding_step: string;
  onboarding_completed_at: string | null;
}

export interface MeResponse {
  profile: { id: string; nickname: string; email: string | null; phone: string | null; status: string };
  onboarding: UserOnboarding | null;
  preferences: {
    dismiss_like_popup?: boolean;
    font_size?: string;
    notification_settings?: NotificationSettings;
  };
  pending_apply_activity_id: string | null;
}

export type NotificationType =
  | "recommendation"
  | "region"
  | "interest"
  | "career"
  | "preference"
  | "support"
  | "deadline_bookmark"
  | "deadline_recommend"
  | "hobby"
  | "onboarding_complete";

export interface NotificationItem {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string;
  activity_id: string | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationSettings = Partial<Record<NotificationType, boolean>>;
