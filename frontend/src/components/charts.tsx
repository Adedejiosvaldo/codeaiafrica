import type { ReactNode } from "react";
import { Card, cx } from "./ui";

export function StatCard({ label, value, sub, icon, tone = "brand" }:
  { label: string; value: ReactNode; sub?: ReactNode; icon: ReactNode; tone?: "brand" | "sun" | "clay" | "ink" }) {
  const tones = { brand: "bg-brand-50 text-brand-700", sun: "bg-sun-100 text-[#8a5d00]", clay: "bg-clay-50 text-clay-700", ink: "bg-ink/5 text-ink" };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <span className={cx("grid h-9 w-9 place-items-center rounded-xl", tones[tone])}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-[34px] font-bold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-sm text-ink-soft">{sub}</p>}
    </Card>
  );
}

/** Vertical bars with a hover label. Values are counts. */
export function Bars({ data, height = 140, labelEvery = 1, color = "bg-brand-500" }:
  { data: { label: string; value: number; title?: string }[]; height?: number; labelEvery?: number; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }} role="img"
        aria-label={data.map((d) => `${d.title ?? d.label}: ${d.value}`).join(", ")}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end">
            <div className={cx("w-full rounded-t-[4px] transition-opacity group-hover:opacity-80", d.value ? color : "bg-line")}
              style={{ height: `${d.value ? Math.max(4, (d.value / max) * 100) : 2}%` }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow group-hover:opacity-100">
              {d.title ?? d.label}: {d.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] text-[11px] text-ink-faint">
        {data.map((d, i) => (
          <span key={d.label} className={cx("min-w-0 flex-1", labelEvery > 1 ? "overflow-visible whitespace-nowrap" : "truncate text-center")}>
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal share bars, e.g. applications by device. */
export function ShareList({ items }: { items: { label: string; value: number }[] }) {
  const total = Math.max(1, items.reduce((s, i) => s + i.value, 0));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between text-sm">
            <span className="font-medium">{i.label}</span>
            <span className="tabular-nums text-ink-soft">{i.value} · {Math.round((i.value / total) * 100)}%</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-line">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(i.value / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
