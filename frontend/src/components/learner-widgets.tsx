import { useState } from "react";
import type { FormEvent } from "react";
import { Check, Link2, Lock, Send } from "lucide-react";
import { ApiError, api } from "../lib/api";
import type { LearnerDashboard, LearnerWeek } from "../lib/types";
import type { WeekStatus } from "../lib/learner";
import { Button, TextInput, cx, useToast } from "./ui";

/* ------------------------------------------------------------------ submit a lab */

export function SubmitForm({ week, token, onDone }: { week: LearnerWeek; token: string; onDone: () => void }) {
  const toast = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ message: string }>(`/learner/${token}/submissions`, { week: week.week, value });
      toast(r.message);
      setValue("");
      onDone();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  const isCode = week.kind === "code";
  return (
    <form onSubmit={submit} noValidate className="space-y-2.5">
      <label htmlFor={`v-${week.week}`} className="block text-sm font-semibold">
        {isCode ? "Completion code" : week.prompt}
      </label>
      <div className="relative">
        {!isCode && <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />}
        <TextInput id={`v-${week.week}`} value={value} onChange={(e) => { setValue(e.target.value); setError(""); }}
          placeholder={isCode ? `AK-W${String(week.week).padStart(2, "0")}-XXXXXX` : "https://"} invalid={!!error}
          className={cx(isCode && "font-mono uppercase tracking-wide", !isCode && "pl-10")}
          inputMode={isCode ? "text" : "url"} autoCapitalize={isCode ? "characters" : "off"} autoComplete="off" />
      </div>
      {error && <p className="text-sm font-medium text-clay-700" role="alert">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!value.trim()}>
        <Send className="h-4 w-4" aria-hidden /> {week.done ? "Submit again" : "Submit"}
      </Button>
      {isCode && <p className="text-xs text-ink-faint">The last cell of the notebook prints this code once every exercise passes.</p>}
    </form>
  );
}

/* ------------------------------------------------------------------ status icon */

export function StatusDot({ status, week, size = "md" }: { status: WeekStatus; week: number; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 text-xs" : "h-10 w-10 text-[15px]";
  if (status === "done") {
    return <span className={cx("grid shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white", dims)}>
      <Check className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} aria-label="Done" /></span>;
  }
  if (status === "upcoming") {
    return <span className={cx("grid shrink-0 place-items-center rounded-full bg-paper text-ink-faint ring-1 ring-line", dims)}>
      <Lock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} aria-label="Not open yet" /></span>;
  }
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full font-display font-bold",
      status === "current" ? "bg-sun-300 text-brand-900 ring-4 ring-sun-300/30"
        : status === "next" ? "bg-card text-brand-700 ring-2 ring-brand-500" : "bg-card text-ink ring-1 ring-line-strong", dims)}>
      {week}
    </span>
  );
}

export const STATUS_LABEL: Record<WeekStatus, string> = {
  done: "Submitted", current: "This week", open: "Catch up", next: "Up next", upcoming: "Coming soon",
};

/* ------------------------------------------------------------------ activity heatmap */

const DAY = 86400000;
const toISO = (d: Date) => d.toISOString().slice(0, 10);

export function Heatmap({ data }: { data: LearnerDashboard }) {
  const start = new Date(data.start_date + "T00:00:00Z");
  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const counts: Record<string, number> = {};
  data.activity.forEach((d) => { counts[d] = (counts[d] ?? 0) + 1; });
  const tone = (n: number) => (n === 0 ? "bg-line/80" : n === 1 ? "bg-brand-200" : n === 2 ? "bg-brand-500" : "bg-brand-700");
  const dayLabels = ["Sat", "", "Mon", "", "Wed", "", "Fri"];
  const total = data.activity.length;

  return (
    <div>
      <div className="flex gap-2">
        <div className="grid grid-rows-[repeat(7,18px)] gap-1 pt-[22px] text-[10px] leading-none text-ink-faint sm:grid-rows-[repeat(7,22px)]" aria-hidden>
          {dayLabels.map((l, i) => <span key={i} className="flex h-full items-center">{l}</span>)}
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
          <div className="grid w-max grid-cols-[repeat(12,18px)] gap-1 sm:grid-cols-[repeat(12,22px)]">
            {Array.from({ length: 12 }, (_, w) => (
              <span key={w} className="pb-1.5 text-[10px] font-medium leading-none text-ink-faint">{w % 3 === 0 ? `W${w + 1}` : ""}</span>
            ))}
            {Array.from({ length: 7 }, (_, day) =>
              Array.from({ length: 12 }, (_, w) => {
                const iso = toISO(new Date(start.getTime() + (w * 7 + day) * DAY));
                const n = counts[iso] ?? 0;
                const future = iso > todayISO;
                return (
                  <span key={`${w}-${day}`} title={`${iso}: ${n ? `${n} submission${n > 1 ? "s" : ""}` : "no activity"}`}
                    className={cx("h-[18px] w-[18px] rounded-[4px] sm:h-[22px] sm:w-[22px]", future ? "bg-paper ring-1 ring-inset ring-line" : tone(n),
                      iso === todayISO && "ring-2 ring-inset ring-sun-500")}
                    style={{ gridColumn: w + 1, gridRow: day + 2 }} />
                );
              }),
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
        <span>{total} {total === 1 ? "contribution" : "contributions"} this cohort</span>
        <span className="flex items-center gap-1" aria-hidden>
          Less {[0, 1, 2, 3].map((n) => <span key={n} className={cx("h-2.5 w-2.5 rounded-[3px]", tone(n))} />)} More
        </span>
      </div>
    </div>
  );
}
