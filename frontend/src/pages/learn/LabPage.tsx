import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronLeft, Code2, Eye, FileText, Lightbulb, Loader2, Lock, PartyPopper, Play, RotateCcw, Sparkles, Square, Target, Terminal, Trash2, XCircle,
} from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { CodeEditor } from "../../lab/CodeEditor";
import { Markdown, inline } from "../../lab/Markdown";
import { usePython, type RunResult } from "../../lab/usePython";
import { Button, Collapse, ErrorState, LinkButton, Logo, PRESS, PageLoader, cx, useToast } from "../../components/ui";

type Step = { id: string; title: string; body: string; task: string; starter: string; check: string; hint: string; solution: string };
type Lab = { week: number; title: string; intro: string; steps: Step[]; passed: string[]; week_done: boolean; email: string;
  setup: string; uses_ai: boolean; completes_week: boolean };
type Line = { kind: "out" | "error" | "pass" | "fail" | "info"; text: string; tip?: string };

const store = {
  get(key: string) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* private mode */ } },
};

export default function LabPage() {
  const { token = "", week = "2" } = useParams();
  const { data, error } = useApi<Lab>(`/learner/${token}/labs/${week}`);
  if (error) {
    return <div className="grid min-h-dvh place-items-center px-4"><ErrorState message={error.message}
      action={<LinkButton to={`/learn/${token}`} variant="secondary">Back to your dashboard</LinkButton>} /></div>;
  }
  if (!data) return <div className="min-h-dvh"><PageLoader /></div>;
  return <LabWorkspace lab={data} token={token} />;
}

function LabWorkspace({ lab, token }: { lab: Lab; token: string }) {
  const toast = useToast();
  const navigate = useNavigate();
  const key = (id: string) => `akada-lab-${token}-w${lab.week}-${id}`;
  const [passed, setPassed] = useState<string[]>(lab.passed);
  const firstOpen = lab.steps.findIndex((s) => !lab.passed.includes(s.id));
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const step = lab.steps[index];
  const [codes, setCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(lab.steps.map((s) => [s.id, store.get(key(s.id)) ?? s.starter])));
  const [lines, setLines] = useState<Line[]>([]);
  const [fails, setFails] = useState<Record<string, number>>({});
  const [hintOpen, setHintOpen] = useState(false);
  const [tab, setTab] = useState<"learn" | "code">("learn");
  const [complete, setComplete] = useState(false);
  const [slow, setSlow] = useState(false);
  const wide = useMediaQuery("(min-width: 1024px)");

  // After (re)starting Python: run the lab's setup, then replay the exact code that passed each earlier step
  // (not whatever is in the editor now, which might be half-edited or loop forever)
  const restore = useCallback(() => [
    ...(lab.setup ? [lab.setup] : []),
    ...lab.steps.filter((s) => passedRef.current.includes(s.id)).map((s) => store.get(key(`${s.id}-passed`)) ?? s.solution),
  ], [lab.steps, lab.setup]); // eslint-disable-line react-hooks/exhaustive-deps
  const passedRef = useRef(passed); passedRef.current = passed;
  const py = usePython(restore, `/api/learner/${token}`);
  const [aiLeft, setAiLeft] = useState<{ remaining: number; limit: number } | null>(null);
  const refreshUsage = useCallback(() => {
    if (!lab.uses_ai) return;
    api.get<{ remaining: number; limit: number }>(`/learner/${token}/ai/usage`).then(setAiLeft).catch(() => {});
  }, [lab.uses_ai, token]);
  useEffect(() => { refreshUsage(); }, [refreshUsage]);
  const busy = py.status !== "ready";

  useEffect(() => { setHintOpen(false); setLines([]); }, [index]);
  const unlocked = (i: number) => i === 0 || passed.includes(lab.steps[i - 1].id) || passed.includes(lab.steps[i].id);

  const setCode = (v: string) => {
    setCodes((c) => ({ ...c, [step.id]: v }));
    store.set(key(step.id), v);
  };

  function show(r: RunResult | null, checking: boolean) {
    if (!r) { setLines([{ kind: "info", text: "Stopped. Python restarted, with your earlier steps restored." }]); return; }
    const out: Line[] = [];
    if (r.output) out.push({ kind: "out", text: r.output.replace(/\n$/, "") });
    if (r.error) out.push({ kind: "error", text: `${r.error.line ? `Line ${r.error.line}: ` : ""}${r.error.message}`, tip: r.error.tip });
    if (!r.output && !r.error && !checking) out.push({ kind: "info", text: "Ran with no output. Use print(...) to show a value." });
    if (checking) out.push(r.passed ? { kind: "pass", text: "PASS: step complete." } : { kind: "fail", text: r.hint });
    setLines(out);
  }

  async function run() {
    if (busy) return;
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 6000);
    const r = await py.run(codes[step.id]);
    clearTimeout(t); setSlow(false);
    show(r, false);
    refreshUsage();
  }

  async function check() {
    if (busy) return;
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 6000);
    const r = await py.run(codes[step.id], step.check);
    clearTimeout(t); setSlow(false);
    show(r, true);
    refreshUsage();
    if (!r) return;
    if (!r.passed) {
      setFails((f) => ({ ...f, [step.id]: (f[step.id] ?? 0) + 1 }));
      return;
    }
    store.set(key(`${step.id}-passed`), codes[step.id]);
    try {
      const res = await api.post<{ passed: string[]; completed: boolean; newly_completed: boolean }>(
        `/learner/${token}/labs/${lab.week}/steps/${step.id}`);
      setPassed(res.passed);
      if (res.completed && (res.newly_completed || index === lab.steps.length - 1)) {
        setComplete(true);
      } else {
        // On phones the view switches back to the instructions, so say it passed; on desktop the banner shows it
        if (!wide) { toast(`Step ${index + 1} passed. On to the next one!`); setTab("learn"); }
      }
    } catch (e) {
      toast((e as ApiError).message, "error");
    }
  }

  function goTo(i: number) {
    if (i < 0 || i >= lab.steps.length || !unlocked(i)) return;
    setIndex(i);
    setTab("learn");
  }

  const isPassed = passed.includes(step.id);
  const showSolution = (fails[step.id] ?? 0) >= 2 || isPassed;

  const instructions = (
    <Instructions lab={lab} step={step} index={index} passed={passed} unlocked={unlocked} goTo={goTo}
      hintOpen={hintOpen} setHintOpen={setHintOpen} showSolution={showSolution}
      useSolution={() => { setCode(step.solution); setTab("code"); toast("Solution loaded into the editor. Read it, then press Check."); }}
      isPassed={isPassed} />
  );

  const editorPane = (
    <EditorPane step={step} index={index} code={codes[step.id]} setCode={setCode} run={run} check={check}
      reset={() => { setCode(step.starter); setLines([]); }} busy={busy} status={py.status}
      stop={() => py.restart()} slow={slow} lines={lines} clear={() => setLines([])} isPassed={isPassed} />
  );

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <TopBar lab={lab} token={token} index={index} passed={passed} status={py.status} detail={py.detail} restart={py.restart} aiLeft={aiLeft} />

      {/* Phones and tablets: two tabs. Desktop: resizable split. */}
      {wide ? <SplitView left={instructions} right={editorPane} /> : (<>
      <div className="flex border-b border-line bg-card" role="tablist">
        {([["learn", "Instructions", FileText], ["code", "Code", Code2]] as const).map(([k, label, Icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cx("flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-[color,border-color] duration-150",
              tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-ink-faint")}>
            <Icon className="h-4 w-4" aria-hidden /> {label}
            {k === "code" && lines.some((l) => l.kind === "fail" || l.kind === "error") && <span className="h-2 w-2 rounded-full bg-clay-500" aria-label="has errors" />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <div className={cx("h-full", tab !== "learn" && "hidden")}>{instructions}</div>
        <div className={cx("h-full", tab !== "code" && "hidden")}>{editorPane}</div>
      </div>
      </>)}

      {complete && <CompleteDialog lab={lab} onReview={() => setComplete(false)} onHome={() => navigate(`/learn/${token}`)} />}
    </div>
  );
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

/* ================================================================== top bar */

function TopBar({ lab, token, index, passed, status, detail, restart, aiLeft }:
  { lab: Lab; token: string; index: number; passed: string[]; status: string; detail: string; restart: () => void;
    aiLeft: { remaining: number; limit: number } | null }) {
  const pill = {
    loading: { dot: "bg-sun-500 animate-pulse", text: detail || "Starting Python" },
    ready: { dot: "bg-brand-500", text: "Python ready" },
    running: { dot: "bg-sun-500 animate-pulse", text: "Running" },
    error: { dot: "bg-clay-500", text: "Python stopped" },
  }[status] ?? { dot: "bg-line-strong", text: status };
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-card px-3 sm:px-4">
      <Link to={`/learn/${token}/week/${lab.week}`} aria-label={`Back to week ${lab.week}`}
        className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-[background-color,scale] duration-150 hover:bg-ink/5", PRESS)}>
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <Link to={`/learn/${token}`} className="hidden sm:block"><Logo /></Link>
      <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Week {lab.week}: {lab.title}</p>
        <p className="text-xs text-ink-faint">Step {index + 1} of {lab.steps.length} · {passed.length} passed</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-line md:block" aria-hidden>
          <div className="h-full rounded-full bg-brand-500 motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${(passed.length / lab.steps.length) * 100}%` }} />
        </div>
        {aiLeft && (
          <span title="AI calls you have left today. Repeating the same request is free."
            className={cx("hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 sm:flex",
              aiLeft.remaining <= 10 ? "bg-clay-50 text-clay-700 ring-clay-500/20" : "bg-paper text-ink-soft ring-line")}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> {aiLeft.remaining}/{aiLeft.limit} AI calls left
          </span>
        )}
        <span className="flex max-w-[170px] items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft ring-1 ring-line" aria-live="polite">
          <span className={cx("h-2 w-2 shrink-0 rounded-full", pill.dot)} aria-hidden /> <span className="truncate">{pill.text}</span>
        </span>
        {status === "error" && <Button size="sm" variant="secondary" onClick={restart}>Retry</Button>}
      </div>
    </header>
  );
}

/* ================================================================== desktop split */

function SplitView({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [pct, setPct] = useState(() => Number(store.get("akada-lab-split")) || 42);
  const box = useRef<HTMLDivElement>(null);
  const clamp = (v: number) => Math.min(65, Math.max(28, v));
  const save = (v: number) => { setPct(v); store.set("akada-lab-split", String(Math.round(v))); };

  function onDown(e: ReactPointerEvent) {
    e.preventDefault();
    const rect = box.current!.getBoundingClientRect();
    const move = (ev: PointerEvent) => save(clamp(((ev.clientX - rect.left) / rect.width) * 100));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); document.body.style.cursor = ""; };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div ref={box} className="grid min-h-0 flex-1" style={{ gridTemplateColumns: `${pct}% 8px 1fr` }}>
      <div className="min-h-0 border-r border-line bg-card">{left}</div>
      <div role="separator" aria-orientation="vertical" aria-label="Resize panels" aria-valuenow={Math.round(pct)} aria-valuemin={28} aria-valuemax={65}
        tabIndex={0} onPointerDown={onDown}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") save(clamp(pct - 2)); if (e.key === "ArrowRight") save(clamp(pct + 2)); }}
        className="group relative cursor-col-resize bg-paper">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line transition-[background-color] duration-150 group-hover:bg-brand-500 group-focus-visible:bg-brand-500" aria-hidden />
        <span className="absolute left-1/2 top-1/2 h-10 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-line-strong transition-[background-color] duration-150 group-hover:bg-brand-500" aria-hidden />
      </div>
      <div className="min-h-0">{right}</div>
    </div>
  );
}

/* ================================================================== instructions (left) */

function Instructions({ lab, step, index, passed, unlocked, goTo, hintOpen, setHintOpen, showSolution, useSolution, isPassed }:
  { lab: Lab; step: Step; index: number; passed: string[]; unlocked: (i: number) => boolean; goTo: (i: number) => void;
    hintOpen: boolean; setHintOpen: (v: boolean) => void; showSolution: boolean; useSolution: () => void; isPassed: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [index]);
  const next = index + 1 < lab.steps.length ? index + 1 : null;

  return (
    <div className="flex h-full flex-col">
      {/* Step rail */}
      <nav className="shrink-0 border-b border-line px-4 py-3 sm:px-6" aria-label="Lab steps">
        <ol className="flex gap-1.5">
          {lab.steps.map((s, i) => {
            const done = passed.includes(s.id);
            const open = unlocked(i);
            return (
              <li key={s.id} className="flex-1">
                <button onClick={() => goTo(i)} disabled={!open} title={`${i + 1}. ${s.title}${open ? "" : " (locked)"}`}
                  aria-current={i === index ? "step" : undefined} aria-label={`Step ${i + 1}: ${s.title}${done ? ", passed" : ""}`}
                  className={cx("flex h-2 w-full rounded-full transition-[background-color,box-shadow] duration-150 disabled:cursor-not-allowed",
                    done ? "bg-brand-500" : i === index ? "bg-sun-300" : "bg-line",
                    i === index && "ring-2 ring-sun-300/50 ring-offset-1")} />
              </li>
            );
          })}
        </ol>
      </nav>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <article className="mx-auto max-w-[680px] px-4 py-6 sm:px-6 sm:py-8">
          {index === 0 && (
            <div className="mb-7 rounded-2xl bg-brand-50/70 p-4 text-[15px] text-ink-soft">
              <p className="font-semibold text-ink">Welcome to the interactive lab</p>
              <p className="mt-1">{lab.intro}</p>
              <p className="mt-2 text-sm lg:hidden">Use the <b>Code</b> tab to write and run your code. It works on a phone, but a laptop or tablet with a keyboard is easier.</p>
              <p className="mt-2 hidden text-sm lg:block">Shortcuts: <kbd className="rounded bg-card px-1.5 font-mono text-xs ring-1 ring-line">Ctrl</kbd> + <kbd className="rounded bg-card px-1.5 font-mono text-xs ring-1 ring-line">Enter</kbd> runs, <kbd className="rounded bg-card px-1.5 font-mono text-xs ring-1 ring-line">Shift</kbd> + <kbd className="rounded bg-card px-1.5 font-mono text-xs ring-1 ring-line">Enter</kbd> checks.</p>
            </div>
          )}
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-600">
            Step {index + 1} of {lab.steps.length}
            {isPassed && <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"><Check className="h-3 w-3" aria-hidden /> Passed</span>}
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight sm:text-[32px]">{step.title}</h1>

          <Markdown text={step.body} className="mt-5 text-[16px] text-ink-soft" />

          <section className="mt-7 rounded-2xl border border-sun-300/70 bg-sun-100/50 p-5">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#7a5300]"><Target className="h-4 w-4" aria-hidden /> Your task</p>
            <p className="mt-2 text-[16px] leading-relaxed text-ink">{inline(step.task)}</p>
          </section>

          <div className="mt-4 space-y-2">
            <button onClick={() => setHintOpen(!hintOpen)} aria-expanded={hintOpen}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink-soft ring-1 ring-line transition-[background-color] duration-150 hover:bg-paper">
              <Lightbulb className="h-4 w-4 text-sun-500" aria-hidden /> {hintOpen ? "Hide the hint" : "Stuck? Show a hint"}
            </button>
            <Collapse open={hintOpen}>
              <pre className="whitespace-pre-wrap rounded-xl bg-paper px-4 py-3 font-mono text-[13.5px] leading-relaxed text-ink">{step.hint}</pre>
            </Collapse>
            {showSolution ? (
              <button onClick={useSolution}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink-soft ring-1 ring-line transition-[background-color] duration-150 hover:bg-paper">
                <Eye className="h-4 w-4 text-brand-600" aria-hidden /> Load the worked solution into the editor
              </button>
            ) : (
              <p className="flex items-center gap-2 px-3 text-xs text-ink-faint"><Lock className="h-3.5 w-3.5" aria-hidden /> The worked solution unlocks after 2 checks.</p>
            )}
          </div>
        </article>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 sm:px-6">
        <Button variant="ghost" onClick={() => goTo(index - 1)} disabled={index === 0}><ArrowLeft className="h-4 w-4" aria-hidden /> Back</Button>
        {next !== null && (
          <Button variant={isPassed ? "primary" : "secondary"} onClick={() => goTo(next)} disabled={!isPassed}
            title={isPassed ? undefined : "Pass this step to continue"}>
            {isPassed ? "Next step" : "Pass to continue"} <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== editor + output (right) */

function EditorPane({ step, index, code, setCode, run, check, reset, busy, status, stop, slow, lines, clear, isPassed }:
  { step: Step; index: number; code: string; setCode: (v: string) => void; run: () => void; check: () => void; reset: () => void;
    busy: boolean; status: string; stop: () => void; slow: boolean; lines: Line[]; clear: () => void; isPassed: boolean }) {
  const running = status === "running";
  const result = [...lines].reverse().find((l) => l.kind === "pass" || l.kind === "fail");
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-paper px-2 py-1.5 sm:px-3">
        <span className="flex items-center gap-2 rounded-t-lg border-b-2 border-brand-600 bg-card px-3 py-1.5 font-mono text-[13px] font-medium">
          <Code2 className="h-3.5 w-3.5 text-brand-600" aria-hidden /> step{index + 1}.py
          {isPassed && <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" aria-label="passed" />}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={reset} title="Go back to the starting code"><RotateCcw className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Reset</span></Button>
          <span className="hidden items-center gap-1 lg:flex">
            <Button size="sm" variant="secondary" onClick={run} disabled={busy}><Play className="h-4 w-4" aria-hidden /> Run</Button>
            <Button size="sm" onClick={check} disabled={busy}><Check className="h-4 w-4" aria-hidden /> Check</Button>
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <CodeEditor value={code} docKey={step.id} onChange={setCode} onRun={run} onCheck={check} ariaLabel={`Code for step ${index + 1}`} />
      </div>

      {/* Output console */}
      <section className="flex h-[38%] min-h-[150px] shrink-0 flex-col border-t border-line bg-[#0d1f16] text-[#e6efe9]" aria-label="Output">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60"><Terminal className="h-3.5 w-3.5" aria-hidden /> Output</p>
          <div className="flex items-center gap-1">
            {running && slow && (
              <button onClick={stop} className={cx("flex items-center gap-1.5 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-white transition-[scale] duration-150", PRESS)}>
                <Square className="h-3 w-3 fill-current" aria-hidden /> Stop
              </button>
            )}
            {lines.length > 0 && !running && (
              <button onClick={clear} aria-label="Clear output" className={cx("grid h-7 w-7 place-items-center rounded-full text-white/50 transition-[background-color,color,scale] duration-150 hover:bg-white/10 hover:text-white", PRESS)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {result && (
          <div className={cx("flex items-start gap-2.5 px-4 py-3 text-sm font-semibold",
            result.kind === "pass" ? "bg-brand-600 text-white" : "bg-clay-500/90 text-white")} role="status">
            {result.kind === "pass" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            <span>{result.kind === "pass" ? "Step passed. Go to the next step when you're ready." : result.text}</span>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 font-mono text-[13px] leading-relaxed" aria-live="polite">
          {running ? (
            <p className="flex items-center gap-2 text-white/60"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Running your code{slow ? ". This is taking a while: is there a loop that never ends?" : "…"}</p>
          ) : lines.filter((l) => l.kind !== "pass" && l.kind !== "fail").length === 0 && !result ? (
            <p className="text-white/40">Press Run to see what your code prints, or Check to test it.</p>
          ) : (
            lines.filter((l) => l.kind !== "pass" && l.kind !== "fail").map((l, i) => (
              <div key={i} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                {l.kind === "out" && <span>{l.text}</span>}
                {l.kind === "info" && <span className="text-white/50">{l.text}</span>}
                {l.kind === "error" && (
                  <div className="mt-1 rounded-lg bg-clay-500/15 px-3 py-2">
                    <p className="text-[#ffb59a]">{l.text}</p>
                    {l.tip && <p className="mt-1 font-sans text-[13px] text-white/75">{l.tip}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Phones: sticky action bar */}
      <div className="flex shrink-0 gap-2 border-t border-line bg-card p-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <Button variant="secondary" size="lg" className="flex-1" onClick={run} disabled={busy}><Play className="h-4 w-4" aria-hidden /> Run</Button>
        <Button size="lg" className="flex-1" onClick={check} disabled={busy}><Check className="h-4 w-4" aria-hidden /> Check</Button>
      </div>
    </div>
  );
}

/* ================================================================== completion */

function CompleteDialog({ lab, onReview, onHome }: { lab: Lab; onReview: () => void; onHome: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.focus(); }, []);
  const steps = useMemo(() => lab.steps.map((s) => s.title), [lab.steps]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]">
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="done-title"
        className="animate-rise w-full max-w-md rounded-[28px] bg-card p-7 text-center shadow-lift outline-none">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sun-100 text-[#8a5d00]"><PartyPopper className="h-8 w-8" aria-hidden /></span>
        <h2 id="done-title" className="mt-4 text-2xl font-bold">Week {lab.week} complete!</h2>
        <p className="mt-2 text-ink-soft">
          You passed all {steps.length} steps.{" "}
          {lab.completes_week ? "We've marked this week as submitted on your dashboard."
            : "Now do part 2 of this week (the notebook), and submit its completion code on the week page."}
        </p>
        <ul className="mt-5 space-y-1.5 text-left text-sm">
          {steps.map((t) => <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> {t}</li>)}
        </ul>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={onReview}>Review my code</Button>
          <Button className="flex-1" onClick={onHome}>Back to dashboard <ArrowRight className="h-4 w-4" aria-hidden /></Button>
        </div>
      </div>
    </div>
  );
}
