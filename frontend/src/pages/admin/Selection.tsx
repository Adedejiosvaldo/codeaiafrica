import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ListChecks, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/AdminLayout";
import { Badge, Button, Card, EmptyState, ErrorState, PageLoader, StatusBadge, cx, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { STATUS } from "../../lib/labels";
import type { SelectionPlan, Status } from "../../lib/types";

export default function Selection() {
  const [includeUnscored, setIncludeUnscored] = useState(false);
  const [plan, setPlan] = useState<SelectionPlan | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.post<SelectionPlan>("/admin/selection/preview", { include_unscored: includeUnscored })
      .then((p) => { setPlan(p); setError(""); })
      .catch((e: ApiError) => setError(e.message));
  }, [includeUnscored]);

  async function apply() {
    setBusy(true);
    try {
      const p = await api.post<SelectionPlan>("/admin/selection/apply", { include_unscored: includeUnscored });
      setPlan(p);
      setConfirming(false);
      toast("Selection applied. Learner links are ready on the Learners page.");
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!plan) return <PageLoader />;
  const held = plan.counts.pending;
  // Number everyone in the running (eligible and scored), so the cut-off line sits after place number `cap`
  let n = 0;
  const ranks = plan.rows.map((r) => (r.eligible && r.decision !== "pending" ? ++n : null));

  return (
    <>
      <PageHeader title="Selection"
        description={`Eligible applicants, highest score first. The top ${plan.cap} get places and the next ${plan.waitlist_size} go on the waitlist. Ties go to whoever applied first.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(["accepted", "waitlisted", "rejected", "pending"] as Status[]).map((s) => (
          <Card key={s} className="p-5">
            <p className="text-sm font-medium text-ink-soft">{s === "pending" ? "Held back (not scored)" : STATUS[s]}</p>
            <p className="mt-1 font-display text-4xl font-bold tabular-nums">{plan.counts[s]}</p>
            {s === "accepted" && <p className="mt-1 text-sm text-ink-soft">of {plan.cap} places</p>}
          </Card>
        ))}
      </div>

      <Card className="mt-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={includeUnscored} onChange={(e) => setIncludeUnscored(e.target.checked)}
            className="mt-1 h-4 w-4 accent-brand-600" />
          <span>
            <span className="block font-semibold">Include people whose problem answer isn't scored</span>
            <span className="block text-sm text-ink-soft">
              {held ? `${held} people are held back until they're scored. ` : ""}Unscored answers count as 0.
              {held > 0 && !includeUnscored && <> <Link to="/admin/applications?filter=unscored" className="font-semibold text-brand-700 hover:underline">Score them first</Link>.</>}
            </span>
          </span>
        </label>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button onClick={apply} loading={busy}>Yes, apply {plan.changes} change{plan.changes === 1 ? "" : "s"}</Button>
          </div>
        ) : (
          <Button className="shrink-0" onClick={() => setConfirming(true)} disabled={plan.changes === 0}>
            <Sparkles className="h-4 w-4" aria-hidden /> {plan.changes ? `Apply ${plan.changes} change${plan.changes === 1 ? "" : "s"}` : "Nothing to change"}
          </Button>
        )}
      </Card>
      {confirming && (
        <p className="mt-2 text-sm text-ink-soft">
          Accepted people get a learner link. People moved out of a place lose theirs, unless they've already started.
        </p>
      )}

      <Card className="mt-4 overflow-hidden">
        {plan.rows.length === 0 ? (
          <EmptyState icon={<ListChecks className="h-6 w-6" />} title="No applications yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead className="border-b border-line bg-paper text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <tr><th className="w-14 px-5 py-3">#</th><th className="px-3 py-3">Applicant</th><th className="px-3 py-3 text-center">Score</th>
                  <th className="px-3 py-3">Now</th><th className="px-3 py-3" /><th className="px-5 py-3">After selection</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {plan.rows.map((r, i) => {
                  return (
                    <tr key={r.id} className={cx(r.changes && "bg-sun-100/40", ranks[i] === plan.cap && "border-b-2 border-b-brand-500")}>
                      <td className="px-5 py-3 tabular-nums text-ink-faint">{ranks[i] ?? "–"}</td>
                      <td className="px-3 py-3"><p className="font-semibold">{r.name}</p>
                        <p className="text-sm text-ink-soft">{r.reason || `${r.city}`}</p></td>
                      <td className="px-3 py-3 text-center font-display font-bold tabular-nums">{r.eligible ? r.total_score : "–"}</td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-1 py-3 text-ink-faint">{r.changes && <ArrowRight className="h-4 w-4" aria-label="changes to" />}</td>
                      <td className="px-5 py-3">{r.changes ? <StatusBadge status={r.decision} /> : <Badge>No change</Badge>}</td>
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
