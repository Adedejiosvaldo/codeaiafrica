import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useApi } from "../lib/useApi";
import type { PublicConfig } from "../lib/types";
import { cx, LinkButton, Logo, PRESS } from "./ui";

export function usePublicConfig() {
  return useOutletContext<PublicConfig | null>();
}

export default function PublicLayout() {
  const { data: config } = useApi<PublicConfig>("/public/config");
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    setOpen(false);
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  const cta = config?.applications_open
    ? { to: "/apply", label: "Apply now" }
    : { to: "/#waitlist", label: "Join the waitlist" };
  const nav = [
    { to: "/#course", label: "The course" },
    { to: "/try", label: "Try it in 10 minutes" },
    { to: "/#faq", label: "FAQ" },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Akada Labs home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to}
                className="rounded-full px-3.5 py-2 text-[15px] font-medium text-ink-soft hover:bg-ink/5 hover:text-ink">
                {n.label}
              </NavLink>
            ))}
            <LinkButton to={cta.to} size="md" className="ml-2">{cta.label}</LinkButton>
          </nav>
          <button className={cx("grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5 md:hidden transition-[background-color,color,scale] duration-150 ease-out", PRESS)}
            onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className={cx("border-t border-line bg-paper px-4 pb-5 pt-2 md:hidden", !open && "hidden")}>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-ink/5">
              {n.label}
            </Link>
          ))}
          <LinkButton to={cta.to} size="lg" className="mt-3 w-full">{cta.label}</LinkButton>
        </div>
      </header>

      <main className="flex-1">
        <Outlet context={config} />
      </main>

      <footer className="bg-brand-900 text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo light />
            <p className="max-w-sm text-sm leading-relaxed">
              A free, practical AI course for Nigerians. "Akada" is what we call someone who loves to learn.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Course</p>
            <Link to="/#course" className="block hover:text-white">12-week plan</Link>
            <Link to="/try" className="block hover:text-white">Train your first AI</Link>
            <Link to="/apply" className="block hover:text-white">Apply</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Team</p>
            <Link to="/admin" className="block hover:text-white">Team sign in</Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Akada Labs
        </div>
      </footer>
    </div>
  );
}
