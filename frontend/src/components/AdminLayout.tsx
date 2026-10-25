import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ClipboardCheck, ExternalLink, LayoutDashboard, ListChecks, LogOut, Settings, Users, UserPlus } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Button, cx, ErrorState, Logo, PageLoader, PRESS } from "./ui";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/applications", label: "Applications", icon: ClipboardCheck },
  { to: "/admin/selection", label: "Selection", icon: ListChecks },
  { to: "/admin/learners", label: "Learners", icon: Users },
  { to: "/admin/waitlist", label: "Waitlist", icon: UserPlus },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { data: me, error, loading } = useApi<{ email: string; name: string }>("/admin/me");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (error?.status === 401) navigate(`/admin/login?next=${encodeURIComponent(pathname)}`, { replace: true });
  }, [error, navigate, pathname]);

  async function signOut() {
    await api.post("/admin/logout").catch(() => {});
    navigate("/admin/login");
  }

  if (error && error.status !== 401) {
    return <ErrorState message={error.message} action={<Button onClick={() => window.location.reload()}>Try again</Button>} />;
  }
  if (loading || !me) return <div className="min-h-dvh bg-paper"><PageLoader /></div>;

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-card px-3 py-5 lg:flex">
        <Link to="/admin" className="px-3"><Logo /></Link>
        <p className="mt-1 px-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Team dashboard</p>
        <nav className="mt-6 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
              )}>
              <Icon className="h-[18px] w-[18px]" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          <a href="/" target="_blank" rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-ink/5">
            <ExternalLink className="h-4 w-4" aria-hidden /> View public site
          </a>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.name || "Team member"}</p>
              <p className="truncate text-xs text-ink-faint">{me.email}</p>
            </div>
            <button onClick={signOut} className={cx("grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-ink/5 transition-[background-color,color,scale] duration-150 ease-out", PRESS)}
              aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/admin"><Logo /></Link>
          <button onClick={signOut} className={cx("grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5 transition-[background-color,color,scale] duration-150 ease-out", PRESS)}
            aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cx("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium",
                isActive ? "bg-ink text-white" : "text-ink-soft hover:bg-ink/5")}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
