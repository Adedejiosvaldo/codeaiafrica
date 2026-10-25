import type { ReactNode } from "react";
import { BookOpen, Check, CheckCircle2, Circle, Flame, Globe, Lock, Play, Send } from "lucide-react";
import { cx } from "./ui";

/** A browser-style window frame for product mock-ups. */
export function Window({ url, children, className }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-hidden rounded-[20px] bg-card text-ink shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_30px_80px_-20px_rgb(0_0_0/0.6)]", className)}>
      <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ec6a5e]" />
          <span className="h-3 w-3 rounded-full bg-[#f4bf4f]" />
          <span className="h-3 w-3 rounded-full bg-[#61c554]" />
        </div>
        <div className="mx-auto flex max-w-sm flex-1 items-center justify-center gap-1.5 rounded-md bg-card px-3 py-1 text-xs text-ink-faint ring-1 ring-line">
          <Lock className="h-3 w-3" aria-hidden /> <span className="truncate">{url}</span>
        </div>
        <span className="w-[54px]" aria-hidden />
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Learn: the learner dashboard */

export function DashboardMock() {
  const weeks = [
    ["Train your first AI", "done"], ["Python in the browser", "done"], ["Working with data", "done"],
    ["Your first ML model", "current"], ["When models go wrong", "next"],
  ] as const;
  return (
    <div className="grid gap-4 bg-paper p-4 text-left sm:p-6 md:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl bg-brand-900 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-sun-300">Continue learning · Week 4</p>
          <p className="mt-1.5 font-display text-2xl font-bold">Your first ML model</p>
          <p className="mt-1 text-sm text-white/70">Train a decision tree on Lagos rental listings.</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sun-300 px-4 text-sm font-semibold text-brand-900">
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden /> Open lab
            </span>
            <span className="text-xs text-white/60">About 2 hours</span>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <p className="text-sm font-semibold">Learning path</p>
          <ul className="mt-3 space-y-2.5">
            {weeks.map(([t, s], i) => (
              <li key={t} className="flex items-center gap-3 text-sm">
                <span className={cx("grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                  s === "done" ? "bg-brand-600 text-white" : s === "current" ? "bg-sun-300 text-brand-900" : "bg-line text-ink-faint")}>
                  {s === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span className={cx(s === "next" && "text-ink-faint", s === "current" && "font-semibold")}>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <p className="text-xs text-ink-soft">Labs done</p>
            <p className="font-display text-2xl font-bold">3<span className="text-base text-ink-faint">/9</span></p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <p className="flex items-center gap-1 text-xs text-ink-soft"><Flame className="h-3.5 w-3.5 text-clay-500" aria-hidden /> Streak</p>
            <p className="font-display text-2xl font-bold">3<span className="text-base text-ink-faint"> weeks</span></p>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <p className="text-sm font-semibold">Activity</p>
          <HeatmapMock />
        </div>
      </div>
    </div>
  );
}

function HeatmapMock() {
  // A fixed pattern purely for the illustration
  const levels = "0010200010030001200102003100002301000102300100".split("").map(Number);
  const tone = ["bg-line", "bg-brand-200", "bg-brand-500", "bg-brand-700"];
  return (
    <div className="mt-3 grid w-max grid-flow-col grid-rows-[repeat(7,13px)] gap-[3px]" aria-hidden>
      {Array.from({ length: 7 * 14 }, (_, i) => (
        <span key={i} className={cx("h-[13px] w-[13px] rounded-[3px]", tone[levels[(i * 7) % levels.length]])} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Practise: the browser lab */

export function NotebookMock() {
  return (
    <div className="grid bg-card text-left md:grid-cols-[200px_1fr]">
      <aside className="hidden border-r border-line bg-paper p-3 text-sm md:block">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Files</p>
        {["week02-python-in-the-browser.ipynb", "week03-working-with-data.ipynb", "week04-first-ml-model.ipynb", "data/"].map((f, i) => (
          <p key={f} className={cx("mt-1 flex items-center gap-2 truncate rounded-md px-2 py-1.5", i === 0 && "bg-brand-50 font-medium text-brand-700")}>
            <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden /> <span className="truncate">{f}</span>
          </p>
        ))}
      </aside>
      <div className="space-y-3 p-4 font-mono text-[13px] leading-relaxed sm:p-6">
        <p className="font-sans text-base font-bold">Exercise 4: Write a function</p>
        <p className="font-sans text-sm text-ink-soft">Write <code className="rounded bg-paper px-1">air_label(pm25)</code> that returns "poor" when PM2.5 is above 35.</p>
        <div className="flex gap-3 rounded-xl bg-paper p-3.5">
          <span className="select-none text-ink-faint">[7]</span>
          <pre className="whitespace-pre"><span className="text-brand-700">def</span> <span className="text-[#7a5300]">air_label</span>(pm25):{"\n"}    <span className="text-brand-700">if</span> pm25 &gt; 35:{"\n"}        <span className="text-brand-700">return</span> <span className="text-clay-700">"poor"</span>{"\n"}    <span className="text-brand-700">return</span> <span className="text-clay-700">"good"</span></pre>
        </div>
        <div className="flex gap-3 rounded-xl p-3.5 ring-1 ring-line">
          <span className="select-none text-ink-faint">[8]</span>
          <div>
            <p className="text-ink-soft">check.week2.check_4(air_label)</p>
            <p className="mt-1.5 flex items-center gap-1.5 font-sans text-sm font-semibold text-brand-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> PASS: exercise 4 done.
            </p>
          </div>
        </div>
        <p className="flex items-center gap-2 font-sans text-xs text-ink-faint"><Circle className="h-2.5 w-2.5 fill-brand-500 text-brand-500" aria-hidden /> Python running in your browser</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Ship: a deployed capstone */

export function AppMock() {
  return (
    <div className="bg-paper p-4 text-left sm:p-8">
      <div className="mx-auto max-w-xl rounded-2xl bg-card p-5 shadow-soft sm:p-6">
        <p className="font-display text-xl font-bold">Pidgin sentiment checker</p>
        <p className="text-sm text-ink-soft">Built in the Akada Labs AI course</p>
        <p className="mt-4 text-sm font-semibold">Customer message</p>
        <div className="mt-1.5 rounded-xl px-3.5 py-3 text-[15px] ring-1 ring-line-strong">Abeg, una network don dey vex me since morning</div>
        <div className="mt-3 flex justify-end">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white">
            <Send className="h-3.5 w-3.5" aria-hidden /> Submit
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold">Result</p>
        <div className="mt-1.5 rounded-xl bg-clay-50 px-3.5 py-3 text-[15px] text-clay-700">
          <b>Negative</b>: the customer is upset about poor network service.
        </div>
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-faint"><Globe className="h-3.5 w-3.5" aria-hidden /> Live on the internet, free</p>
    </div>
  );
}
