import { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Download, GraduationCap, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "../../components/AdminLayout";
import { AButton, Badge, Card, cx, EmptyState, ErrorState, PageLoader, PRESS, TextInput, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { formatDate, learnerLink } from "../../lib/labels";
import type { LearnerRow } from "../../lib/types";
import { useApi } from "../../lib/useApi";

type Data = { weeks: { week: number; title: string }[]; learners: LearnerRow[] };

export default function Learners() {
  const { data, error, setData } = useApi<Data>("/admin/learners");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "progress">("name");
  const toast = useToast();

  const rows = useMemo(() => {
    if (!data) return [];
    const n = q.trim().toLowerCase();
    const list = data.learners.filter((l) => !n || l.name.toLowerCase().includes(n) || l.email.toLowerCase().includes(n));
    return sort === "progress" ? [...list].sort((a, b) => a.labs_done - b.labs_done) : list;
  }, [data, q, sort]);

  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;

  const copy = (token: string) => { navigator.clipboard?.writeText(learnerLink(token)); toast("Link copied"); };
  async function reset(l: LearnerRow) {
    if (!confirm(`Make a new link for ${l.name}? Their old link will stop working.`)) return;
    try {
      const { token } = await api.post<{ token: string }>(`/admin/learners/${l.id}/reset-link`);
      setData((d) => d && { ...d, learners: d.learners.map((x) => (x.id === l.id ? { ...x, token } : x)) });
      navigator.clipboard?.writeText(learnerLink(token));
      toast("New link made and copied");
    } catch (e) { toast((e as ApiError).message, "error"); }
  }

  return (
    <>
      <PageHeader title="Learners" description="Who has submitted which week. Sort by progress to see who needs a nudge."
        actions={<AButton href="/api/admin/export/learners.csv" variant="secondary"><Download className="h-4 w-4" aria-hidden /> Export with links</AButton>} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <TextInput placeholder="Search learners" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 pl-10 text-[15px]" aria-label="Search learners" />
        </div>
        <div className="flex gap-1 rounded-full bg-card p-1 ring-1 ring-line">
          {(["name", "progress"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={cx("rounded-full px-3.5 py-1.5 text-sm font-semibold",
              sort === s ? "bg-ink text-white" : "text-ink-soft")}>{s === "name" ? "A–Z" : "Least done first"}</button>
          ))}
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={<GraduationCap className="h-6 w-6" />} title={data.learners.length ? "No one matches" : "No learners yet"}>
            {!data.learners.length && "Accept applicants (or run selection) and they'll appear here."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[15px]">
              <thead className="border-b border-line bg-paper text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="sticky left-0 bg-paper px-5 py-3">Learner</th>
                  {data.weeks.map((w) => <th key={w.week} className="px-0 py-3 text-center" title={w.title}>{w.week}</th>)}
                  <th className="px-3 py-3 text-center">Labs</th>
                  <th className="px-3 py-3 text-center">Quiz</th>
                  <th className="px-5 py-3 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((l) => {
                  const ok = l.labs_done >= l.labs_required;
                  return (
                    <tr key={l.id} className="hover:bg-paper/60">
                      <td className="sticky left-0 bg-card px-5 py-3">
                        <p className="font-semibold">{l.name}</p>
                        <p className="text-xs text-ink-soft">Last active {formatDate(l.last_activity)} · {l.attended} session{l.attended === 1 ? "" : "s"}</p>
                        {l.capstone && <p className="max-w-[220px] truncate text-xs text-brand-700" title={l.capstone}>{l.capstone}</p>}
                      </td>
                      {data.weeks.map((w) => (
                        <td key={w.week} className="px-0 py-3 text-center">
                          <span className={cx("mx-auto grid h-6 w-6 place-items-center rounded-md",
                            l.weeks_done.includes(w.week) ? "bg-brand-500 text-white" : "bg-line/70")}
                            title={`Week ${w.week}: ${l.weeks_done.includes(w.week) ? "done" : "not yet"}`}>
                            {l.weeks_done.includes(w.week) && <Check className="h-3.5 w-3.5" aria-hidden />}
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        <Badge tone={ok ? "brand" : "neutral"}>{l.labs_done}/{l.labs_required}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center text-sm tabular-nums text-ink-soft">
                        {l.pre_score ?? "–"} <ArrowRight className="inline h-3 w-3 align-[-1px]" aria-label="to" /> <b className="text-ink">{l.post_score ?? "–"}</b>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => copy(l.token)} className={cx("grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-ink/5 transition-[background-color,color,scale] duration-150 ease-out", PRESS)} title="Copy link" aria-label={`Copy ${l.name}'s link`}><Copy className="h-4 w-4" /></button>
                          <button onClick={() => reset(l)} className={cx("grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-ink/5 transition-[background-color,color,scale] duration-150 ease-out", PRESS)} title="Make a new link" aria-label={`Make a new link for ${l.name}`}><RefreshCw className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
