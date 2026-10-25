import { ArrowRight, ClipboardCheck, GraduationCap, Hourglass, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Bars, ShareList, StatCard } from "../../components/charts";
import { PageHeader } from "../../components/AdminLayout";
import { Badge, Card, ErrorState, PageLoader } from "../../components/ui";
import { DEVICES, OCCUPATIONS, STATUS, label } from "../../lib/labels";
import type { Stats, Status } from "../../lib/types";
import { useApi } from "../../lib/useApi";

export default function Overview() {
  const { data, error } = useApi<Stats>("/admin/stats");
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;
  const a = data.applications;
  const { pre, post } = data.quiz;

  return (
    <>
      <PageHeader title={`${data.cohort_name} overview`}
        description="Applications, learner progress and quiz results at a glance."
        actions={<Badge tone={data.applications_open ? "brand" : "neutral"} className="py-1.5 text-sm">
          Applications {data.applications_open ? "open" : "closed"}
        </Badge>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applications" value={a.total} icon={<ClipboardCheck className="h-[18px] w-[18px]" />}
          sub={`${a.eligible} eligible · ${a.never_coded} never coded`} />
        <StatCard label="Need a problem score" value={a.unscored} tone="sun" icon={<Hourglass className="h-[18px] w-[18px]" />}
          sub={a.unscored ? <Link to="/admin/applications?filter=unscored" className="font-semibold text-brand-700 hover:underline">Review them →</Link> : "All caught up"} />
        <StatCard label="Learners" value={<>{data.learners.total}<span className="text-xl text-ink-faint">/{data.cap}</span></>}
          tone="ink" icon={<GraduationCap className="h-[18px] w-[18px]" />} sub="places filled" />
        <StatCard label="Waitlist sign-ups" value={data.waitlist} tone="clay" icon={<UserPlus className="h-[18px] w-[18px]" />}
          sub={<Link to="/admin/waitlist" className="font-semibold text-brand-700 hover:underline">See the list →</Link>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Applications, last 30 days</h2>
            <span className="text-sm text-ink-soft">{a.per_day.reduce((s, d) => s + d.count, 0)} in total</span>
          </div>
          <div className="mt-5">
            <Bars labelEvery={5} height={220} data={a.per_day.map((d) => {
              const date = new Date(d.date);
              return { label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value: d.count };
            })} />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold">Decisions</h2>
          <div className="mt-4 space-y-2.5">
            {(Object.keys(STATUS) as Status[]).map((s) => (
              <div key={s} className="flex items-center justify-between rounded-xl bg-paper px-4 py-3">
                <span className="font-medium">{STATUS[s]}</span>
                <span className="font-display text-xl font-bold tabular-nums">{a.by_status[s]}</span>
              </div>
            ))}
          </div>
          <Link to="/admin/selection" className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Run selection <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Labs submitted, by week</h2>
            <span className="text-sm text-ink-soft">{data.learners.total} learners</span>
          </div>
          <div className="mt-5">
            <Bars color="bg-sun-500" height={200} data={data.learners.submissions_per_week.map((w) => ({ label: `W${w.week}`, title: `Week ${w.week}`, value: w.count }))} />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold">Knowledge check</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[["Week 1", pre], ["Week 12", post]].map(([name, p]) => {
              const phase = p as Stats["quiz"]["pre"];
              return (
                <div key={name as string} className="rounded-xl bg-paper p-4">
                  <p className="text-sm text-ink-soft">{name as string}</p>
                  <p className="font-display text-3xl font-bold">{phase.average ?? "—"}{phase.average !== null && <span className="text-lg text-ink-faint">%</span>}</p>
                  <p className="text-xs text-ink-faint">{phase.count} taken</p>
                </div>
              );
            })}
          </div>
          <h3 className="mt-5 text-sm font-semibold text-ink-soft">Average confidence (1–5)</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {data.quiz.confidence_labels.map((l, i) => (
              <li key={l} className="flex items-center justify-between gap-3">
                <span className="truncate">{l}</span>
                <span className="shrink-0 tabular-nums text-ink-soft">{pre.confidence[i] ?? "—"} → <b className="text-ink">{post.confidence[i] ?? "—"}</b></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Applicants' devices</h2>
          <ShareList items={Object.keys(DEVICES).map((k) => ({ label: label(DEVICES, k), value: a.by_device[k] ?? 0 }))} />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Who's applying</h2>
          <ShareList items={Object.keys(OCCUPATIONS).map((k) => ({ label: label(OCCUPATIONS, k), value: a.by_occupation[k] ?? 0 }))} />
        </Card>
      </div>
    </>
  );
}
