export const OCCUPATIONS = { student: "University student", working: "Working", looking: "Looking for work", other: "Other" };
export const DEVICES = { own_laptop: "Own laptop", shared_laptop: "Shared or family laptop", cyber_cafe: "Cyber café", phone_only: "Phone only" };
export const LIVE = { yes: "Yes, every week", most_weeks: "Most weeks", no: "No" };
export const HOURS = { under_2: "Under 2 hours", "2_4": "2–4 hours", over_4: "Over 4 hours" };
export const CODED = { never: "Never", a_little: "A little", yes: "Yes" };
export const STATUS = { pending: "To review", accepted: "Accepted", waitlisted: "Waitlist", rejected: "Not accepted" };

export function label(map: Record<string, string>, key: string) {
  return map[key] ?? key;
}

export function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function learnerLink(token: string) {
  return `${window.location.origin}/learn/${token}`;
}
