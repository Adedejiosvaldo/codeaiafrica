import { AlertTriangle, CheckCircle2, Cpu, Scissors, XCircle } from "lucide-react";
import { Bars, StatCard } from "../../components/charts";
import { PageHeader } from "../../components/AdminLayout";
import { Card, EmptyState, ErrorState, PageLoader, cx } from "../../components/ui";
import { useApi } from "../../lib/useApi";

type Usage = {
  today: { day: string; calls: number; tokens: number; errors: number; chunks: number };
  limits: { per_learner: number; budget: number; max_tokens: number };
  configured: { chat: boolean; embeddings: boolean; chunker: boolean };
  models: string[];
  per_day: { day: string; calls: number; tokens: number }[];
  learners: { name: string; calls: number }[];
};

export default function AIUsage() {
  const { data, error } = useApi<Usage>("/admin/ai-usage");
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;
  const pct = Math.min(100, Math.round((data.today.calls / Math.max(1, data.limits.budget)) * 100));

  return (
    <>
      <PageHeader title="AI usage" description="Calls learners make to AI models in the interactive labs, through the server's key. Limits are set in the server's .env file." />

      <div className="flex flex-wrap gap-2">
        {([["chat", "Chat model"], ["embeddings", "Embeddings"], ["chunker", "Chunker"]] as const).map(([k, label]) => (
          <span key={k} className={cx("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1",
            data.configured[k] ? "bg-brand-50 text-brand-700 ring-brand-100" : "bg-clay-50 text-clay-700 ring-clay-500/20")}>
            {data.configured[k] ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
            {label} {data.configured[k] ? "set up" : "not set up"}
          </span>
        ))}
        {data.models.length > 0 && <span className="rounded-full bg-paper px-3 py-1.5 text-sm text-ink-soft ring-1 ring-line">Models: {data.models.join(", ")}</span>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-ink-soft">Class budget today</p>
          <p className="mt-2 font-display text-[34px] font-bold leading-none tabular-nums">{data.today.calls}<span className="text-xl text-ink-faint">/{data.limits.budget}</span></p>
          <div className="mt-3 h-2 rounded-full bg-line"><div className={cx("h-2 rounded-full", pct > 85 ? "bg-clay-500" : "bg-brand-500")} style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-xs text-ink-faint">Resets at midnight, Lagos time</p>
        </Card>
        <StatCard label="Per learner, per day" value={data.limits.per_learner} icon={<Cpu className="h-[18px] w-[18px]" />} sub={`Replies up to ${data.limits.max_tokens} tokens`} />
        <StatCard label="Failed calls today" value={data.today.errors} tone={data.today.errors ? "clay" : "ink"} icon={<AlertTriangle className="h-[18px] w-[18px]" />}
          sub={data.today.errors ? "Check the server logs if this keeps rising" : "All good"} />
        <StatCard label="Chunker calls today" value={data.today.chunks} tone="sun" icon={<Scissors className="h-[18px] w-[18px]" />} sub="Free to run; not counted in the budget" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold">Calls, last 14 days</h2>
          {data.per_day.length ? (
            <div className="mt-5"><Bars height={180} data={data.per_day.map((d) => ({ label: d.day.slice(5), title: `${d.day} (${d.tokens.toLocaleString()} tokens)`, value: d.calls }))} /></div>
          ) : <EmptyState icon={<Cpu className="h-6 w-6" />} title="No AI calls yet">They'll show here once learners start the AI labs.</EmptyState>}
        </Card>
        <Card className="overflow-hidden">
          <h2 className="px-5 pt-5 text-lg font-bold sm:px-6">Learners today</h2>
          {data.learners.length ? (
            <ul className="mt-3 divide-y divide-line">
              {data.learners.map((l) => (
                <li key={l.name} className="flex items-center gap-3 px-5 py-2.5 sm:px-6">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.name}</span>
                  <div className="h-1.5 w-24 rounded-full bg-line"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (l.calls / data.limits.per_learner) * 100)}%` }} /></div>
                  <span className="w-14 text-right text-sm tabular-nums text-ink-soft">{l.calls}/{data.limits.per_learner}</span>
                </li>
              ))}
            </ul>
          ) : <p className="px-6 pb-6 pt-3 text-sm text-ink-faint">No calls today.</p>}
        </Card>
      </div>
    </>
  );
}
