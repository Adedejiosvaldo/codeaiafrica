import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ClipboardCheck, Copy, Download, Search, SkipForward, X } from "lucide-react";
import { PageHeader } from "../../components/AdminLayout";
import { AButton, Badge, Button, Card, cx, EmptyState, ErrorState, PageLoader, PRESS, StatusBadge, TextArea, TextInput, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { CODED, DEVICES, HOURS, LIVE, OCCUPATIONS, STATUS, formatDate, label, learnerLink } from "../../lib/labels";
import type { AppDetail, AppRow, Status } from "../../lib/types";
import { useApi } from "../../lib/useApi";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unscored", label: "Needs score" },
  { key: "pending", label: STATUS.pending },
  { key: "accepted", label: STATUS.accepted },
  { key: "waitlisted", label: STATUS.waitlisted },
  { key: "rejected", label: STATUS.rejected },
] as const;

export default function Applications() {
  const { data, error, setData } = useApi<AppRow[]>("/admin/applications");
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.filter((r) => {
      if (filter === "unscored" && !(r.q9_score === null && r.eligible && r.status === "pending")) return false;
      if (filter !== "all" && filter !== "unscored" && r.status !== filter) return false;
      return !needle || [r.name, r.email, r.city, r.problem].some((v) => v.toLowerCase().includes(needle));
    });
  }, [data, filter, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length ?? 0, unscored: 0 };
    data?.forEach((r) => {
      c[r.status] = (c[r.status] ?? 0) + 1;
      if (r.q9_score === null && r.eligible && r.status === "pending") c.unscored++;
    });
    return c;
  }, [data]);

  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;

  const updateRow = (d: AppDetail) => setData((all) => all?.map((r) => (r.id === d.id ? { ...r, ...d } : r)) ?? null);
  const nextUnscored = (afterId: number) =>
    data.find((r) => r.id !== afterId && r.q9_score === null && r.eligible && r.status === "pending")?.id ?? null;

  return (
    <>
      <PageHeader title="Applications" description="Score each applicant's problem (0–3). The rest of the rubric is worked out for you."
        actions={<AButton href="/api/admin/export/applications.csv" variant="secondary"><Download className="h-4 w-4" aria-hidden /> Export CSV</AButton>} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setParams(f.key === "all" ? {} : { filter: f.key })}
              className={cx("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                filter === f.key ? "bg-ink text-white" : "bg-card text-ink-soft ring-1 ring-line hover:text-ink")}>
              {f.label}
              <span className={cx("rounded-full px-1.5 text-xs tabular-nums", filter === f.key ? "bg-white/20" : "bg-ink/5")}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <TextInput placeholder="Search name, city, idea…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 pl-10 text-[15px]" aria-label="Search applications" />
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title={data.length ? "Nothing matches" : "No applications yet"}>
            {data.length ? "Try another filter or search." : "They'll appear here as people apply."}
          </EmptyState>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[15px] md:table">
              <thead className="border-b border-line bg-paper text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-3 py-3">Their idea</th>
                  <th className="px-3 py-3 text-center">Score</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSelected(r.id)}
                    className={cx("cursor-pointer transition-colors hover:bg-brand-50/40", selected === r.id && "bg-brand-50/60")}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-sm text-ink-soft">{r.city} · {label(DEVICES, r.device)}</p>
                    </td>
                    <td className="max-w-md px-3 py-3.5"><p className="line-clamp-2 text-sm text-ink-soft">{r.problem}</p></td>
                    <td className="px-3 py-3.5 text-center"><ScorePill row={r} /></td>
                    <td className="px-3 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-ink-soft">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSelected(r.id)} className="flex w-full items-start gap-3 px-4 py-4 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-sm text-ink-soft">{r.city} · {formatDate(r.created_at)}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{r.problem}</p>
                      <div className="mt-2"><StatusBadge status={r.status} /></div>
                    </div>
                    <ScorePill row={r} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <p className="mt-3 text-sm text-ink-faint">Showing {rows.length} of {data.length}</p>

      {selected !== null && (
        <ReviewDrawer id={selected} onClose={() => setSelected(null)} onSaved={updateRow}
          onNext={() => setSelected(nextUnscored(selected))} hasNext={nextUnscored(selected) !== null} />
      )}
    </>
  );
}

function ScorePill({ row }: { row: AppRow }) {
  if (!row.eligible) return <Badge tone="clay">Not eligible</Badge>;
  return (
    <span className={cx("inline-flex min-w-12 items-baseline justify-center gap-0.5 rounded-full px-2.5 py-1 font-display font-bold tabular-nums",
      row.q9_score === null ? "bg-sun-100 text-[#7a5300]" : "bg-brand-50 text-brand-700")}
      title={row.q9_score === null ? "Problem answer not scored yet" : undefined}>
      {row.total_score}<span className="text-xs font-semibold opacity-60">{row.q9_score === null ? "+?" : "/10"}</span>
    </span>
  );
}

function ReviewDrawer({ id, onClose, onSaved, onNext, hasNext }:
  { id: number; onClose: () => void; onSaved: (d: AppDetail) => void; onNext: () => void; hasNext: boolean }) {
  const { data, error, setData } = useApi<AppDetail>(`/admin/applications/${id}`);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  // Open on the frame after mount so the slide-in is a transition (it can reverse if closed mid-way)
  const [shown, setShown] = useState(false);
  useEffect(() => { const f = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(f); }, []);
  function close() {
    setShown(false);
    setTimeout(onClose, 200); // matches the exit duration below
  }

  useEffect(() => { if (data) setNote(data.reviewer_note); }, [data?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (data && !(e.target instanceof HTMLTextAreaElement) && ["0", "1", "2", "3"].includes(e.key)) save({ q9_score: Number(e.key) }, "score");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-bind each render so save() sees fresh data

  async function save(patch: Record<string, unknown>, what: string) {
    setBusy(what);
    try {
      const d = await api.patch<AppDetail>(`/admin/applications/${id}`, patch);
      setData(d);
      onSaved(d);
      if (what === "note") toast("Note saved");
      if (what === "status") toast(`Marked as ${STATUS[d.status].toLowerCase()}`);
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div onClick={close} className={cx("absolute inset-0 bg-ink/30 backdrop-blur-[2px] transition-[opacity] ease-out",
        shown ? "opacity-100 duration-300" : "opacity-0 duration-200")} />
      <aside role="dialog" aria-modal="true" aria-label="Application"
        className={cx("absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-paper shadow-lift transition-[translate,opacity]",
          shown ? "translate-x-0 opacity-100 duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
            : "translate-x-full duration-200 ease-out motion-reduce:translate-x-0 motion-reduce:opacity-0")}>
        <div className="flex items-center justify-between border-b border-line bg-card px-5 py-4">
          <p className="text-sm font-semibold text-ink-soft">Application #{id}</p>
          <button onClick={close} className={cx("grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5 transition-[background-color,color,scale] duration-150 ease-out", PRESS)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {error ? <ErrorState message={error.message} /> : !data ? <PageLoader /> : (
          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6">
            <div>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={data.status} />
                {!data.eligible && <Badge tone="clay">{!data.is_adult ? "Under 18" : "Won't commit to 9 labs"}</Badge>}</div>
              <h2 className="mt-2 text-2xl font-bold">{data.name}</h2>
              <p className="text-ink-soft">{data.city}, {data.country} · {label(OCCUPATIONS, data.occupation)}</p>
              <p className="mt-1 text-sm text-ink-soft">{data.email} · {data.whatsapp}</p>
            </div>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">What problem would you like to solve with AI?</p>
              <p className="mt-2 text-[17px] leading-relaxed">{data.problem}</p>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-sm font-semibold">Score this answer <span className="font-normal text-ink-faint">(or press 0–3)</span></p>
                <p className="text-xs text-ink-soft">3 = specific and clearly their own · 0 = blank or copied</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((n) => (
                    <button key={n} onClick={() => save({ q9_score: n }, "score")} disabled={busy === "score"}
                      className={cx("h-12 rounded-xl border font-display text-xl font-bold transition-[border-color,background-color,color,box-shadow,scale] duration-150 ease-out", PRESS,
                        data.q9_score === n ? "border-brand-600 bg-brand-600 text-white shadow-soft" : "border-line-strong bg-card hover:border-brand-500")}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold">Score breakdown</h3>
                <p className="font-display text-2xl font-bold">{data.total_score}<span className="text-base text-ink-faint">/10</span></p>
              </div>
              <dl className="mt-2 divide-y divide-line rounded-xl border border-line bg-card text-[15px]">
                {[
                  ["Saturday sessions", label(LIVE, data.live_sessions), data.breakdown.live_sessions, 3],
                  ["Lab hours", label(HOURS, data.lab_hours), data.breakdown.lab_hours, 2],
                  ["Device", label(DEVICES, data.device), data.breakdown.device, 2],
                  ["Problem answer", data.q9_score === null ? "Not scored yet" : "Reviewed", data.breakdown.problem, 3],
                ].map(([k, v, pts, max]) => (
                  <div key={k as string} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <dt><span className="font-medium">{k}</span><span className="ml-2 text-sm text-ink-soft">{v}</span></dt>
                    <dd className="tabular-nums text-ink-soft"><b className="text-ink">{pts ?? "–"}</b>/{max}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2.5 text-sm text-ink-soft">
                  <span>Coded before (not scored)</span><span>{label(CODED, data.coded_before)}</span>
                </div>
              </dl>
            </div>

            <div>
              <label htmlFor="note" className="font-bold">Reviewer note</label>
              <TextArea id="note" rows={3} className="mt-2" placeholder="Only the team sees this." value={note} onChange={(e) => setNote(e.target.value)} />
              {note !== data.reviewer_note && (
                <Button size="sm" variant="secondary" className="mt-2" loading={busy === "note"} onClick={() => save({ reviewer_note: note }, "note")}>Save note</Button>
              )}
            </div>

            <div>
              <h3 className="font-bold">Decision</h3>
              <p className="text-sm text-ink-soft">Usually set by running selection. Change it here for one person.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(STATUS) as Status[]).map((s) => (
                  <button key={s} onClick={() => save({ status: s }, "status")} disabled={busy === "status" || data.status === s}
                    className={cx("flex h-10 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-[border-color,background-color,color,scale] duration-150 ease-out", PRESS,
                      data.status === s ? "border-ink bg-ink text-white" : "border-line-strong bg-card hover:border-ink-faint")}>
                    {data.status === s && <Check className="h-4 w-4" aria-hidden />} {STATUS[s]}
                  </button>
                ))}
              </div>
            </div>

            {data.learner_token && (
              <Card className="bg-brand-50/60 p-4">
                <p className="text-sm font-semibold">Learner link</p>
                <p className="mt-1 text-xs text-ink-soft">Send this privately on WhatsApp. It's their dashboard for submitting labs.</p>
                <div className="mt-2 flex gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-card px-3 py-2 text-sm">{learnerLink(data.learner_token)}</code>
                  <Button size="sm" variant="secondary" className="h-auto" onClick={() => { navigator.clipboard?.writeText(learnerLink(data.learner_token!)); toast("Link copied"); }}>
                    <Copy className="h-4 w-4" aria-hidden /> Copy
                  </Button>
                </div>
              </Card>
            )}
            <p className="text-xs text-ink-faint">Applied {formatDate(data.created_at, true)}{data.reviewed_at && ` · scored ${formatDate(data.reviewed_at, true)}`}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-card px-5 py-3">
          <Button variant="ghost" onClick={close}>Close</Button>
          <Button onClick={onNext} disabled={!hasNext}><SkipForward className="h-4 w-4" aria-hidden /> Next to score</Button>
        </div>
      </aside>
    </div>
  );
}
