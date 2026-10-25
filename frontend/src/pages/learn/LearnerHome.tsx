import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CalendarDays, ChevronRight, ClipboardList, Clock, Flame, Laptop, Trophy } from "lucide-react";
import { useLearner } from "../../components/LearnerLayout";
import { Heatmap, STATUS_LABEL, StatusDot } from "../../components/learner-widgets";
import { AButton, Badge, Card, LinkButton, ProgressRing, cx } from "../../components/ui";
import { daysUntil, greeting, hours, nextWeek, prettyDate, streak, weekStatus } from "../../lib/learner";
import { labLink } from "../../lib/links";

export default function LearnerHome() {
  const { data, token } = useLearner();
  const base = `/learn/${token}`;
  const up = nextWeek(data);
  const lab = up ? labLink(up) : null;
  const left = Math.max(0, data.labs_required - data.labs_done);
  const runStreak = streak(data);
  const until = daysUntil(data.next_session);
  const phaseWeeks = up ? data.weeks.filter((w) => w.phase === up.phase) : [];

  const subline = data.current_week === 0
    ? `Your course starts ${prettyDate(data.start_date, { weekday: "long", day: "numeric", month: "long" })}.`
    : data.current_week > 12 ? "The course has finished. Thank you for learning with us."
      : `Week ${data.current_week} of 12${data.next_session ? ` · Next live session ${prettyDate(data.next_session)}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-[30px] font-bold leading-tight sm:text-4xl">{greeting()}, {data.first_name}</h1>
        <p className="mt-1 text-ink-soft">{subline}</p>
      </div>

      {/* Continue learning */}
      {up ? (
        <section className="animate-rise stagger-1 relative overflow-hidden rounded-[28px] bg-brand-900 text-white">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgb(246_196_83/0.25),transparent)]" />
          <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sun-300">{weekStatus(up, data) === "next" ? "Get ahead" : "Continue learning"} · Week {up.week} · {up.phase}</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{up.title}</h2>
              <p className="mt-2 max-w-xl text-white/70">{up.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1"><Laptop className="h-3.5 w-3.5" aria-hidden /> {up.where}</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1"><Clock className="h-3.5 w-3.5" aria-hidden /> {hours(up.minutes)}</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1"><BookOpen className="h-3.5 w-3.5" aria-hidden /> {up.objectives.length} goals</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              {lab && (
                <AButton href={lab.href} target={lab.href.startsWith("/try") ? undefined : "_blank"} rel="noopener" variant="sun" size="lg">
                  {lab.label} <ArrowRight className="h-4 w-4" aria-hidden />
                </AButton>
              )}
              <LinkButton to={`${base}/week/${up.week}`} variant="ghost" size="lg" className="border border-white/15 text-white hover:bg-white/10 hover:text-white">
                Submit your work
              </LinkButton>
            </div>
          </div>
        </section>
      ) : (
        <Card className="flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun-100 text-[#8a5d00]"><Trophy className="h-6 w-6" aria-hidden /></span>
          <div><p className="text-xl font-bold">All 12 weeks submitted</p><p className="text-ink-soft">That's the whole course. See you on demo day.</p></div>
        </Card>
      )}

      {/* Stats */}
      <div className="animate-rise stagger-2 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4 sm:p-5">
          <ProgressRing value={data.labs_done} max={data.labs_required} size={52} stroke={6}>
            <span className="text-xs font-bold">{Math.round((Math.min(data.labs_done, data.labs_required) / data.labs_required) * 100)}%</span>
          </ProgressRing>
          <div><p className="text-xs font-medium text-ink-soft">Labs done</p>
            <p className="font-display text-2xl font-bold tabular-nums">{data.labs_done}<span className="text-base text-ink-faint">/{data.labs_required}</span></p></div>
        </Card>
        <Stat icon={<Flame className="h-5 w-5" />} tone="clay" label="Week streak" value={runStreak} unit={runStreak === 1 ? "week" : "weeks"} />
        <Stat icon={<ClipboardList className="h-5 w-5" />} tone="brand" label="Knowledge check"
          value={data.quiz.post.score ?? data.quiz.pre.score ?? "—"} unit={data.quiz.pre.done ? "%" : ""} />
        <Stat icon={<Award className="h-5 w-5" />} tone="sun" label="Labs to certificate"
          value={left === 0 ? "Earned" : left} unit={left === 0 ? "" : "to go"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Your activity</h2>
            <span className="text-xs text-ink-faint">From {prettyDate(data.start_date, { day: "numeric", month: "short" })}</span>
          </div>
          <Heatmap data={data} />
        </Card>
        <div className="grid content-start gap-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink-soft">Next live session</p>
                <p className="mt-1 text-lg font-bold">{data.next_session ? prettyDate(data.next_session, { weekday: "long", day: "numeric", month: "long" }) : "No more sessions"}</p>
                {data.next_session_week && <p className="text-sm text-ink-soft">Week {data.next_session_week}, 60 minutes, online</p>}
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><CalendarDays className="h-5 w-5" aria-hidden /></span>
            </div>
            {until !== null && (
              <p className={cx("mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold", until <= 1 ? "bg-sun-100 text-[#7a5300]" : "bg-paper text-ink-soft")}>
                {until === 0 ? "Today" : until === 1 ? "Tomorrow" : `In ${until} days`}
              </p>
            )}
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun-100 text-[#8a5d00]"><Trophy className="h-5 w-5" aria-hidden /></span>
            <div><p className="font-semibold">Demo day</p><p className="text-sm text-ink-soft">{data.demo_day || "Date to be announced"}, live online</p></div>
          </Card>
        </div>
      </div>

      {up && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6">
            <h2 className="text-lg font-bold">{up.phase}</h2>
            <Link to={`${base}/path`} className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Full path <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {phaseWeeks.map((w) => {
              const s = weekStatus(w, data);
              return (
                <li key={w.week}>
                  <Link to={`${base}/week/${w.week}`} className="flex items-center gap-4 px-5 py-3.5 transition-[background-color] duration-150 hover:bg-paper sm:px-6">
                    <StatusDot status={s} week={w.week} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className={cx("font-semibold", s === "upcoming" && "text-ink-soft")}>{w.title}</p>
                      <p className="text-sm text-ink-faint">Week {w.week} · {w.where}</p>
                    </div>
                    <Badge tone={s === "done" ? "brand" : s === "current" ? "sun" : s === "open" ? "clay" : s === "next" ? "brand" : "neutral"} className="hidden sm:inline-flex">{STATUS_LABEL[s]}</Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon, label, value, unit, tone }: { icon: ReactNode; label: string; value: ReactNode; unit: string; tone: "brand" | "sun" | "clay" }) {
  const tones = { brand: "bg-brand-50 text-brand-700", sun: "bg-sun-100 text-[#8a5d00]", clay: "bg-clay-50 text-clay-700" };
  return (
    <Card className="flex items-center gap-4 p-4 sm:p-5">
      <span className={cx("grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl", tones[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        <p className="font-display text-2xl font-bold tabular-nums">{value}<span className="ml-1 font-sans text-sm font-medium text-ink-faint">{unit}</span></p>
      </div>
    </Card>
  );
}
