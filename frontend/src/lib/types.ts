export type Status = "pending" | "accepted" | "waitlisted" | "rejected";

export interface PublicConfig {
  cohort_name: string;
  applications_open: boolean;
  applications_close: string;
  places: number;
  labs_required: number;
  demo_day: string;
  start_date: string;
}

export interface Week {
  week: number;
  title: string;
  kind: "code" | "link";
  where: string;
  summary: string;
  prompt?: string;
  notebook?: string;
  minutes: number;
  objectives: string[];
  phase: "Foundations" | "Modern AI" | "Ship it";
}

export interface LearnerWeek extends Week {
  done: boolean;
  value: string | null;
  submitted_at: string | null;
}

export interface QuizPhaseState {
  open: boolean;
  done: boolean;
  score: number | null;
  confidence: number[] | null;
}

export interface LearnerDashboard {
  name: string;
  first_name: string;
  email: string;
  cohort_name: string;
  labs_required: number;
  labs_done: number;
  demo_day: string;
  weeks: LearnerWeek[];
  quiz: { pre: QuizPhaseState; post: QuizPhaseState };
  start_date: string;
  current_week: number;
  next_session: string | null;
  next_session_week: number | null;
  activity: string[];
}

export interface Quiz {
  phase: "pre" | "post";
  questions: { id: number; text: string; options: string[] }[];
  confidence: string[];
  done: boolean;
  score: number | null;
}

export interface AppRow {
  id: number;
  created_at: string;
  name: string;
  email: string;
  city: string;
  country: string;
  occupation: string;
  device: string;
  live_sessions: string;
  lab_hours: string;
  coded_before: string;
  q9_score: number | null;
  status: Status;
  eligible: boolean;
  auto_score: number;
  total_score: number;
  problem: string;
}

export interface AppDetail extends AppRow {
  whatsapp: string;
  is_adult: boolean;
  commits: boolean;
  reviewer_note: string;
  reviewed_at: string | null;
  breakdown: { live_sessions: number; lab_hours: number; device: number; problem: number | null };
  learner_token: string | null;
}

export interface Stats {
  cohort_name: string;
  applications_open: boolean;
  cap: number;
  applications: {
    total: number;
    eligible: number;
    unscored: number;
    by_status: Record<Status, number>;
    by_device: Record<string, number>;
    by_occupation: Record<string, number>;
    never_coded: number;
    per_day: { date: string; count: number }[];
  };
  waitlist: number;
  learners: { total: number; labs_required: number; submissions_per_week: { week: number; count: number }[] };
  quiz: {
    pre: { count: number; average: number | null; confidence: (number | null)[] };
    post: { count: number; average: number | null; confidence: (number | null)[] };
    confidence_labels: string[];
    out_of: number;
  };
}

export interface SelectionPlan {
  cap: number;
  waitlist_size: number;
  rows: (AppRow & { decision: Status; reason: string; changes: boolean })[];
  counts: Record<Status, number>;
  changes: number;
}

export interface LearnerRow {
  id: number;
  application_id: number;
  name: string;
  email: string;
  whatsapp: string;
  token: string;
  weeks_done: number[];
  labs_done: number;
  labs_required: number;
  pre_score: number | null;
  post_score: number | null;
  last_activity: string | null;
}

export interface SettingsData {
  cohort_name: string;
  applications_open: boolean;
  applications_close: string;
  cap: number;
  waitlist_size: number;
  labs_required: number;
  post_quiz_open: boolean;
  demo_day: string;
  start_date: string;
}
