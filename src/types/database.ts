export type ReportStatus = "reported" | "in_progress" | "resolved";

export type ReportCategory =
  | "pothole"
  | "garbage"
  | "streetlight"
  | "drainage"
  | "water"
  | "noise";

export type InteractionType = "upvote" | "downvote";

export interface Report {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ReportCategory;
  status: ReportStatus;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  photo_urls: string[] | null;
  eta_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReportInteraction {
  id: string;
  report_id: string;
  user_id: string;
  interaction_type: InteractionType;
  created_at: string;
  updated_at: string;
}

export interface ReportWithVotes extends Report {
  upvotes: number;
  downvotes: number;
}
