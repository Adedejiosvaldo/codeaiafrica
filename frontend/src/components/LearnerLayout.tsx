import { Link, NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { ClipboardList, Home, Map, Play } from "lucide-react";
import type { LearnerDashboard } from "../lib/types";
import { useApi } from "../lib/useApi";
import { nextWeek } from "../lib/learner";
import { ErrorState, LinkButton, Logo, PageLoader, cx } from "./ui";

export type LearnerContext = { data: LearnerDashboard; token: string; reload: () => void };
export const useLearner = () => useOutletContext<LearnerContext>();

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function LearnerLayout() {
  const { token = "" } = useParams();
  const { data, error, loading, reload } = useApi<LearnerDashboard>(`/learner/${token}`);

  if (loading && !data) return <div className="min-h-dvh"><PageLoader /></div>;
  if (error || !data) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="text-center">
          <Link to="/"><Logo /></Link>
          <ErrorState message={error?.message ?? "Something went wrong."} action={<LinkButton to="/find-my-link" variant="secondary">Get my link by email</LinkButton>} />
        </div>
      </div>
    );
  }

  const base = `/learn/${token}`;
  const up = nextWeek(data);
  const nav = [
    { to: base, label: "Home", icon: Home, end: true },
    { to: `${base}/path`, label: "Learning path", icon: Map },
    { to: `${base}/quiz`, label: "Knowledge check", icon: ClipboardList },
  ];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr] print:block">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-card px-3 py-5 lg:flex print:hidden">
        <Link to={base} className="px-3"><Logo /></Link>
        <p className="mt-1 px-3 text-xs font-medium text-ink-faint">{data.cohort_name}</p>
        <nav className="mt-7 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-[background-color,color] duration-150",
              isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-ink/5 hover:text-ink")}>
              <Icon className="h-[18px] w-[18px]" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        {up && (
          <Link to={`${base}/week/${up.week}`} className="mx-1 mt-6 block rounded-2xl bg-brand-900 p-4 text-white transition-[background-color] duration-150 hover:bg-brand-700">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sun-300">Up next · Week {up.week}</p>
            <p className="mt-1 font-semibold leading-snug">{up.title}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-sun-300"><Play className="h-3.5 w-3.5" aria-hidden /> Continue</p>
          </Link>
        )}
        <div className="mt-auto flex items-center gap-3 border-t border-line px-3 pt-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun-100 text-sm font-bold text-[#7a5300]">{initials(data.name)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{data.name}</p>
            <p className="truncate text-xs text-ink-faint">{data.email}</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-card/90 px-4 backdrop-blur lg:hidden print:hidden">
        <Link to={base}><Logo /></Link>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sun-100 text-xs font-bold text-[#7a5300]" aria-label={data.name}>{initials(data.name)}</span>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-9 print:p-0">
        <div className="mx-auto max-w-5xl">
          <Outlet context={{ data, token, reload } satisfies LearnerContext} />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden" aria-label="Learner">
        <div className="grid grid-cols-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-[color] duration-150",
              isActive ? "text-brand-700" : "text-ink-faint")}>
              <Icon className="h-5 w-5" aria-hidden /> {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
