import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, CalendarDays, CheckCircle2, ChevronRight, Circle, Clock, ExternalLink, Laptop, Lock } from "lucide-react";
import { useLearner } from "../../components/LearnerLayout";
import { STATUS_LABEL, SubmitForm } from "../../components/learner-widgets";
import { AButton, Badge, Card, LinkButton } from "../../components/ui";
import { formatDate } from "../../lib/labels";
import { hours, prettyDate, weekStatus } from "../../lib/learner";
import { labLink } from "../../lib/links";

const HOW_TO: Record<"code" | "link", string[]> = {
  code: [
    "Open the lab and put the email you applied with in the first cell.",
    "Work through each exercise. Every check cell prints PASS or a hint.",
    "Run the last cell to get your completion code.",
    "Paste the code here and submit.",
  ],
  link: [
    "Open the guide and follow it step by step.",
    "Share or publish your work so others can see it.",
    "Copy the link to it.",
    "Paste the link here and submit.",
  ],
};

export default function WeekPage() {
  const { n = "1" } = useParams();
  const { data, token, reload } = useLearner();
  const week = data.weeks.find((w) => w.week === Number(n));
  const base = `/learn/${token}`;
  if (!week) return <p className="py-20 text-center text-ink-soft">There's no week {n}. <Link to={base} className="font-semibold text-brand-700">Go back home</Link></p>;

  const status = weekStatus(week, data);
  const lab = labLink(week);
  const prev = data.weeks.find((w) => w.week === week.week - 1);
  const next = data.weeks.find((w) => w.week === week.week + 1);
  const sessionDate = new Date(data.start_date + "T12:00:00");
  sessionDate.setDate(sessionDate.getDate() + (week.week - 1) * 7);

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-sm text-ink-faint" aria-label="Breadcrumb">
        <Link to={`${base}/path`} className="hover:text-ink">Learning path</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span>{week.phase}</span>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink-soft">Week {week.week}</span>
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status === "done" ? "brand" : status === "current" ? "sun" : status === "open" ? "clay" : status === "next" ? "brand" : "neutral"}>{STATUS_LABEL[status]}</Badge>
          <span className="text-sm text-ink-faint">Week {week.week} of 12</span>
        </div>
        <h1 className="mt-2 text-[32px] font-bold leading-tight sm:text-5xl">{week.title}</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">{week.summary}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
          <span className="flex items-center gap-1.5"><Laptop className="h-4 w-4" aria-hidden /> {week.where}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden /> {hours(week.minutes)}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden /> Live session {prettyDate(sessionDate.toISOString().slice(0, 10))}</span>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold">What you'll do</h2>
            <ul className="mt-4 space-y-3">
              {week.objectives.map((o) => (
                <li key={o} className="flex gap-3">
                  {week.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                    : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-line-strong" aria-hidden />}
                  <span className="text-[16px]">{o}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold">How to finish this week</h2>
            <ol className="mt-4 space-y-4">
              {HOW_TO[week.kind].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper font-display text-sm font-bold text-ink-soft ring-1 ring-line">{i + 1}</span>
                  <span className="pt-0.5 text-ink-soft">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
          {week.week === 9 && (
            <Card className="flex gap-4 p-5"><Award className="h-6 w-6 shrink-0 text-sun-500" aria-hidden />
              <p className="text-ink-soft"><b className="text-ink">Capstone week.</b> Pick a brief (or your own idea) and post it in the cohort WhatsApp group by Saturday.</p></Card>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5 sm:p-6">
            {lab && (
              <AButton href={lab.href} target={lab.href.startsWith("/try") ? undefined : "_blank"} rel="noopener" size="lg" className="w-full">
                {lab.label} <ExternalLink className="h-4 w-4" aria-hidden />
              </AButton>
            )}
            {status === "upcoming" && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-soft">
                <Lock className="h-4 w-4 shrink-0" aria-hidden /> This week hasn't started yet. You can look ahead.
              </p>
            )}
            <div className={lab ? "mt-5 border-t border-line pt-5" : ""}>
              {week.done && week.value && (
                <div className="mb-4 rounded-xl bg-brand-50 px-3.5 py-3 text-sm">
                  <p className="flex items-center gap-1.5 font-semibold text-brand-700"><CheckCircle2 className="h-4 w-4" aria-hidden /> Submitted {formatDate(week.submitted_at)}</p>
                  <p className="mt-1 font-mono text-ink [overflow-wrap:anywhere]">{week.value}</p>
                </div>
              )}
              <SubmitForm week={week} token={token} onDone={reload} />
            </div>
          </Card>
        </aside>
      </div>

      <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
        {prev ? <LinkButton to={`${base}/week/${prev.week}`} variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden /> Week {prev.week}</LinkButton> : <span />}
        {next && <LinkButton to={`${base}/week/${next.week}`} variant="secondary">Week {next.week}: {next.title} <ArrowRight className="h-4 w-4" aria-hidden /></LinkButton>}
      </div>
    </div>
  );
}
