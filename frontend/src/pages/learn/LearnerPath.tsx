import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { useLearner } from "../../components/LearnerLayout";
import { STATUS_LABEL, StatusDot } from "../../components/learner-widgets";
import { Badge, Card, cx } from "../../components/ui";
import { hours, weekStatus } from "../../lib/learner";

const PHASES = [
  { name: "Foundations", note: "Python, data and your first models, in the browser" },
  { name: "Modern AI", note: "Neural networks, LLMs, search, RAG and agents, on Kaggle or Colab" },
  { name: "Ship it", note: "Put your capstone online and show it to the world" },
] as const;

export default function LearnerPath() {
  const { data, token } = useLearner();
  return (
    <div>
      <h1 className="text-[30px] font-bold sm:text-4xl">Learning path</h1>
      <p className="mt-1 text-ink-soft">12 weeks in 3 phases. Submit {data.labs_required} labs to earn your certificate.</p>

      <div className="mt-8 space-y-10">
        {PHASES.map((p, i) => {
          const weeks = data.weeks.filter((w) => w.phase === p.name);
          const done = weeks.filter((w) => w.done).length;
          return (
            <section key={p.name}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-ink-faint">PHASE 0{i + 1}</p>
                  <h2 className="text-2xl font-bold">{p.name}</h2>
                  <p className="text-sm text-ink-soft">{p.note}</p>
                </div>
                <div className="w-40">
                  <div className="flex justify-between text-xs font-medium text-ink-soft"><span>Progress</span><span>{done}/{weeks.length}</span></div>
                  <div className="mt-1.5 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(done / weeks.length) * 100}%` }} /></div>
                </div>
              </div>
              <ol className="relative mt-5 space-y-3">
                <span aria-hidden className="absolute bottom-6 left-[31px] top-6 w-0.5 bg-line sm:left-[35px]" />
                {weeks.map((w) => {
                  const s = weekStatus(w, data);
                  return (
                    <li key={w.week} className="relative">
                      <Link to={`/learn/${token}/week/${w.week}`}>
                        <Card className={cx("flex items-center gap-4 p-3 pr-4 transition-[box-shadow] duration-150 hover:shadow-lift sm:p-4",
                          s === "current" && "border-sun-300 ring-4 ring-sun-300/20")}>
                          <StatusDot status={s} week={w.week} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Week {w.week} · {w.where}</p>
                            <p className={cx("font-display text-lg font-semibold leading-snug", s === "upcoming" && "text-ink-soft")}>{w.title}</p>
                            <p className="mt-0.5 hidden text-sm text-ink-soft sm:block">{w.summary}</p>
                          </div>
                          <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                            <Badge tone={s === "done" ? "brand" : s === "current" ? "sun" : s === "open" ? "clay" : s === "next" ? "brand" : "neutral"}>{STATUS_LABEL[s]}</Badge>
                            <span className="flex items-center gap-1 text-xs text-ink-faint"><Clock className="h-3.5 w-3.5" aria-hidden /> {hours(w.minutes)}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
