import type { LearnerDashboard, LearnerWeek } from "./types";

export type WeekStatus = "done" | "current" | "open" | "next" | "upcoming";

/** Done, this week's lab, already-released but not done, or not reached yet. */
export function weekStatus(w: LearnerWeek, d: LearnerDashboard): WeekStatus {
  if (w.done) return "done";
  if (d.current_week >= 1 && w.week === Math.min(d.current_week, 12)) return "current";
  if (w.week <= d.current_week) return "open";
  // The first week after the current one is ready to start early; later ones are not open yet
  return w.week === Math.max(d.current_week, 0) + 1 ? "next" : "upcoming";
}

/** The lab to show under "Continue learning": this week's if unfinished, else the earliest unfinished one. */
export function nextWeek(d: LearnerDashboard) {
  const current = d.weeks.find((w) => weekStatus(w, d) === "current");
  return current ?? d.weeks.find((w) => !w.done) ?? null;
}

/** Consecutive weeks submitted, counting back from the latest week that has started. */
export function streak(d: LearnerDashboard) {
  let week = Math.min(d.current_week, 12);
  if (week < 1) return 0;
  if (!d.weeks[week - 1].done) week -= 1; // this week isn't over yet
  let n = 0;
  while (week >= 1 && d.weeks[week - 1].done) { n++; week--; }
  return n;
}

export function greeting() {
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function prettyDate(iso: string | null, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", opts);
}

export function daysUntil(iso: string | null) {
  if (!iso) return null;
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }) + "T12:00:00");
  return Math.round((new Date(iso + "T12:00:00").getTime() - today.getTime()) / 86400000);
}

export function hours(minutes: number) {
  const h = Math.round(minutes / 30) / 2;
  return h === 1 ? "About 1 hour" : `About ${h} hours`;
}
