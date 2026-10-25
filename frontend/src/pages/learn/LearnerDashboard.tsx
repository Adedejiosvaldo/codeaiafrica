import { useState } from "react";
import type { ReactNode } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Award, BookOpen, CalendarDays, Check, ChevronDown, ClipboardList, ExternalLink, Link2, Lock, Send, Trophy,
} from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { formatDate } from "../../lib/labels";
import { labLink } from "../../lib/links";
import type { LearnerDashboard as Data, LearnerWeek } from "../../lib/types";
import { useApi } from "../../lib/useApi";
import { AButton, Badge, Button, Card, ErrorState, LinkButton, Logo, PageLoader, ProgressRing, TextInput, cx, useToast } from "../../components/ui";

export default function LearnerDashboard() {
  const { token = "" } = useParams();
  const { data, error, loading, reload } = useApi<Data>(`/learner/${token}`);
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  if (loading && !data) return <Shell><PageLoader /></Shell>;
  if (error || !data) return <Shell><ErrorState message={error?.message ?? "Something went wrong."} action={<LinkButton to="/" variant="secondary">Go home</LinkButton>} /></Shell>;

  const remaining = Math.max(0, data.labs_required - data.labs_done);
  const nextWeek = data.weeks.find((w) => !w.done);

  return (
    <Shell>
      <div className="animate-rise grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Welcome + progress */}
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sun-300/25 blur-2xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing value={data.labs_done} max={data.labs_required} size={132} stroke={11}>
              <div>
                <p className="font-display text-3xl font-bold leading-none">{data.labs_done}<span className="text-lg text-ink-faint">/{data.labs_required}</span></p>
                <p className="mt-1 text-xs font-medium text-ink-soft">labs done</p>
              </div>
            </ProgressRing>
            <div>
              <Badge tone="brand">{data.cohort_name}</Badge>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome back, {data.first_name}</h1>
              <p className="mt-2 text-ink-soft">
                {remaining === 0
                  ? "You've done enough labs for your certificate. Keep going for your capstone!"
                  : `${remaining} more lab${remaining === 1 ? "" : "s"} to earn your certificate.`}
              </p>
              {nextWeek && (
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => {
                  setOpenWeek(nextWeek.week);
                  document.getElementById(`week-${nextWeek.week}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}>
                  Next up: week {nextWeek.week}, {nextWeek.title}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Side cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <QuizCard token={token} data={data} />
          <Card className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sun-100 text-[#8a5d00]"><Trophy className="h-5 w-5" aria-hidden /></span>
            <div>
              <p className="font-semibold">Demo day</p>
              <p className="text-sm text-ink-soft">{data.demo_day || "Date to be announced"}, live online</p>
            </div>
          </Card>
        </div>
      </div>

      <h2 className="mb-4 mt-12 text-2xl font-bold">Your 12 weeks</h2>
      <div className="space-y-3">
        {data.weeks.map((w) => (
          <WeekRow key={w.week} week={w} token={token} open={openWeek === w.week}
            onToggle={() => setOpenWeek(openWeek === w.week ? null : w.week)} onDone={reload} />
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-ink-faint">
        This page is your personal link. Bookmark it, and don't share it: anyone with it can submit work for you.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <span className="text-sm font-medium text-ink-soft">Learner dashboard</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

function QuizCard({ token, data }: { token: string; data: Data }) {
  const { pre, post } = data.quiz;
  const phase = !pre.done ? "pre" : post.open && !post.done ? "post" : null;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><ClipboardList className="h-5 w-5" aria-hidden /></span>
        <div>
          <p className="font-semibold">AI knowledge check</p>
          <p className="text-sm text-ink-soft">20 questions, about 10 minutes</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        {(["pre", "post"] as const).map((p) => {
          const s = data.quiz[p];
          return (
            <div key={p} className="rounded-xl bg-paper px-3 py-2.5">
              <p className="text-xs font-medium text-ink-soft">{p === "pre" ? "Week 1" : "Week 12"}</p>
              <p className="font-display text-xl font-bold">{s.done ? `${s.score}%` : s.open ? "—" : <Lock className="mx-auto mt-1 h-4 w-4 text-ink-faint" aria-label="Not open yet" />}</p>
            </div>
          );
        })}
      </div>
      {phase && (
        <LinkButton to={`/learn/${token}/quiz/${phase}`} className="mt-4 w-full">
          {phase === "pre" ? "Take the week 1 quiz" : "Take the final quiz"}
        </LinkButton>
      )}
      {pre.done && post.done && pre.score !== null && post.score !== null && (
        <p className="mt-3 text-center text-sm font-semibold text-brand-700">
          {post.score >= pre.score ? `Up ${post.score - pre.score} points since week 1` : "Thanks for taking both quizzes"}
        </p>
      )}
    </Card>
  );
}

function WeekRow({ week, token, open, onToggle, onDone }:
  { week: LearnerWeek; token: string; open: boolean; onToggle: () => void; onDone: () => void }) {
  const toast = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const link = labLink(week);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ message: string }>(`/learner/${token}/submissions`, { week: week.week, value });
      toast(r.message);
      setValue("");
      onDone();
      onToggle();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card id={`week-${week.week}`} className={cx("overflow-hidden transition-shadow", open && "shadow-lift")}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5">
        <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-[15px] font-bold",
          week.done ? "bg-brand-600 text-white" : "bg-paper text-ink-soft ring-1 ring-line")}>
          {week.done ? <Check className="h-5 w-5" strokeWidth={3} aria-label="Done" /> : week.week}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Week {week.week} · {week.where}</p>
          <p className="font-display text-lg font-semibold leading-snug sm:truncate">{week.title}</p>
        </div>
        <span className="hidden shrink-0 sm:block">
          {week.done ? <Badge tone="brand">Submitted {formatDate(week.submitted_at)}</Badge> : <Badge>To do</Badge>}
        </span>
        <ChevronDown className={cx("h-5 w-5 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="animate-fade border-t border-line bg-paper/60 px-4 py-5 sm:px-5 sm:pl-[76px]">
          <p className="text-ink-soft">{week.summary}</p>
          {link && (
            <AButton href={link.href} target={link.href.startsWith("/try") ? undefined : "_blank"} rel="noopener"
              variant="secondary" size="sm" className="mt-3">
              <BookOpen className="h-4 w-4" aria-hidden /> {link.label} <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </AButton>
          )}
          {week.done && week.value && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
              <Check className="h-4 w-4 text-brand-600" aria-hidden /> You submitted
              <code className="rounded bg-card px-1.5 py-0.5 text-ink [overflow-wrap:anywhere]">{week.value}</code>
            </p>
          )}
          <form onSubmit={submit} className="mt-4 space-y-2" noValidate>
            <label htmlFor={`v-${week.week}`} className="block text-sm font-semibold">
              {week.kind === "code" ? "Completion code from the last cell of the notebook" : week.prompt}
              {week.done && <span className="font-normal text-ink-faint"> (submit again to replace it)</span>}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                {week.kind === "link" && <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />}
                <TextInput id={`v-${week.week}`} value={value} onChange={(e) => { setValue(e.target.value); setError(""); }}
                  placeholder={week.kind === "code" ? `AK-W${String(week.week).padStart(2, "0")}-XXXXXX` : "https://"}
                  invalid={!!error} className={cx(week.kind === "code" && "font-mono uppercase tracking-wide", week.kind === "link" && "pl-10")}
                  inputMode={week.kind === "link" ? "url" : "text"} autoCapitalize={week.kind === "code" ? "characters" : "off"} />
              </div>
              <Button type="submit" size="lg" loading={busy} disabled={!value.trim()}>
                <Send className="h-4 w-4" aria-hidden /> Submit
              </Button>
            </div>
            {error && <p className="text-sm font-medium text-clay-700" role="alert">{error}</p>}
          </form>
          {week.week === 9 && (
            <p className="mt-4 flex gap-2 text-sm text-ink-soft"><Award className="mt-0.5 h-4 w-4 shrink-0 text-sun-500" aria-hidden /> This week you also pick your capstone brief.</p>
          )}
          {week.week === 12 && (
            <p className="mt-4 flex gap-2 text-sm text-ink-soft"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden /> 3 minutes to show your tool live, then 1 minute of questions.</p>
          )}
        </div>
      )}
    </Card>
  );
}
