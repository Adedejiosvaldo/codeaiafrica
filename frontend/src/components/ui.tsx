import { createContext, useCallback, useContext, useState } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import { AlertCircle, Check, CheckCircle2, Loader2, X } from "lucide-react";
import type { Status } from "../lib/types";
import { STATUS } from "../lib/labels";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ brand */

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-display text-[19px] font-bold tracking-tight", className)}>
      <svg viewBox="0 0 64 64" className="h-7 w-7 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="16" fill={light ? "#f6c453" : "#0b5d3b"} />
        <path d="M20 46 32 16l12 30M24.5 36h15" stroke={light ? "#0a2e1f" : "#f6c453"} strokeWidth="6" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={light ? "text-white" : "text-ink"}>
        Akada<span className={light ? "text-sun-300" : "text-brand-600"}> Labs</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ buttons */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "sun";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-600 shadow-soft disabled:bg-brand-700/50",
  sun: "bg-sun-300 text-brand-900 hover:bg-sun-500 shadow-soft",
  secondary: "bg-card text-ink border border-line-strong hover:border-ink-faint hover:bg-paper",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  danger: "bg-clay-500 text-white hover:bg-clay-700",
};
const SIZES = { sm: "h-8 px-3 text-sm gap-1.5", md: "h-10 px-4 text-[15px] gap-2", lg: "h-12 px-6 text-base gap-2" };

function buttonClass(variant: Variant, size: keyof typeof SIZES, className?: string) {
  return cx(
    "inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap",
    VARIANTS[variant], SIZES[size], className,
  );
}

export function Button({ variant = "primary", size = "md", loading, children, className, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof SIZES; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, ...rest }:
  LinkProps & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function AButton({ variant = "primary", size = "md", className, ...rest }:
  AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <a className={buttonClass(variant, size, className)} {...rest} />;
}

/* ------------------------------------------------------------------ surfaces */

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-2xl border border-line bg-card shadow-soft", className)} {...rest}>{children}</div>;
}

export function Badge({ tone = "neutral", children, className }:
  { tone?: "neutral" | "brand" | "sun" | "clay" | "ink"; children: ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-ink/5 text-ink-soft",
    brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
    sun: "bg-sun-100 text-[#7a5300] ring-1 ring-sun-300/40",
    clay: "bg-clay-50 text-clay-700 ring-1 ring-clay-500/15",
    ink: "bg-ink text-white",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const tone = { pending: "neutral", accepted: "brand", waitlisted: "sun", rejected: "clay" } as const;
  return <Badge tone={tone[status]}>{STATUS[status]}</Badge>;
}

/* ------------------------------------------------------------------ forms */

export function Field({ label, hint, error, children, htmlFor, optional }:
  { label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[15px] font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-faint">(optional)</span>}
      </label>
      {hint && <p className="text-sm text-ink-soft">{hint}</p>}
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-clay-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-card px-3.5 text-[16px] text-ink placeholder:text-ink-faint transition-colors " +
  "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15";

export function TextInput({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cx(inputBase, "h-12", invalid ? "border-clay-500" : "border-line-strong", className)}
    aria-invalid={invalid || undefined} {...rest} />;
}

export function TextArea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cx(inputBase, "py-3 leading-relaxed", invalid ? "border-clay-500" : "border-line-strong", className)}
    aria-invalid={invalid || undefined} {...rest} />;
}

export function ChoiceGroup<T extends string>({ name, value, options, onChange, columns = 1, invalid }:
  { name: string; value: T | ""; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void;
    columns?: 1 | 2; invalid?: boolean }) {
  return (
    <div role="radiogroup" className={cx("grid gap-2", columns === 2 && "sm:grid-cols-2")}>
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <label key={o.value}
            className={cx(
              "flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all",
              checked ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10"
                : invalid ? "border-clay-500/60 hover:border-clay-500" : "border-line-strong hover:border-ink-faint",
            )}>
            <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)}
              className="sr-only" />
            <span className={cx("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
              checked ? "border-brand-600 bg-brand-600" : "border-line-strong")}>
              {checked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-ink">{o.label}</span>
              {o.hint && <span className="block text-sm text-ink-soft">{o.hint}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }:
  { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6">
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        {hint && <span className="block text-sm text-ink-soft">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cx("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-line-strong")}>
        <span className={cx("absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5")} />
      </button>
    </label>
  );
}

/* ------------------------------------------------------------------ states */

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 className={cx("animate-spin text-brand-600", className)} aria-label="Loading" />;
}

export function PageLoader() {
  return <div className="grid min-h-[40vh] place-items-center"><Spinner className="h-7 w-7" /></div>;
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-3 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-clay-50 text-clay-500">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-ink-soft">{message}</p>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

export function ProgressRing({ value, max, size = 120, stroke = 10, children }:
  { value: number; max: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, max ? value / max : 0);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-brand-100" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className="text-brand-600 transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ toasts */

type Toast = { id: number; message: string; tone: "ok" | "error" };
const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="animate-rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lift">
            {t.tone === "ok" ? <CheckCircle2 className="h-4 w-4 text-sun-300" aria-hidden />
              : <AlertCircle className="h-4 w-4 text-clay-500" aria-hidden />}
            {t.message}
            <button className="ml-1 text-white/60 hover:text-white" aria-label="Dismiss"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
