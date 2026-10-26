import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { useApi } from "../lib/useApi";
import type { PublicConfig } from "../lib/types";
import { Collapse, LinkButton, Logo, PRESS, cx } from "./ui";

export function usePublicConfig() {
  return useOutletContext<PublicConfig | null>();
}

export default function PublicLayout() {
  const { data: config } = useApi<PublicConfig>("/public/config");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname, hash } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => {
    setOpen(false);
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over the dark home hero the bar starts as dark glass; elsewhere (or once scrolled) it is light
  const dark = isHome && !scrolled && !open;
  const cta = config?.applications_open
    ? { to: "/apply", label: "Apply free" }
    : { to: "/#waitlist", label: "Join the waitlist" };
  const nav = [
    { to: "/#path", label: "Curriculum" },
    { to: "/#how", label: "How it works" },
    { to: "/try", label: "Try it free" },
    { to: "/#faq", label: "FAQ" },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="fixed inset-x-0 top-3 z-40 px-3 sm:top-4">
        <div className={cx(
          "mx-auto max-w-5xl rounded-[28px] border backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-out",
          dark ? "border-white/10 bg-white/[0.06]" : "border-transparent bg-card/85 shadow-lift",
        )}>
          <div className="flex h-14 items-center justify-between gap-4 pl-4 pr-2">
            <Link to="/" aria-label="Akada Labs home"><Logo light={dark} /></Link>
            <nav className="hidden items-center gap-0.5 md:flex">
              {nav.map((n) => (
                <NavLink key={n.to} to={n.to}
                  className={cx("rounded-full px-3.5 py-2 text-[14.5px] font-medium transition-[background-color,color] duration-150",
                    dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-ink-soft hover:bg-ink/5 hover:text-ink")}>
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-1.5">
              <LinkButton to={cta.to} size="md" variant={dark ? "sun" : "primary"} className="hidden sm:inline-flex">
                {cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
              </LinkButton>
              <button onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
                className={cx("grid h-10 w-10 place-items-center rounded-full transition-[background-color,scale] duration-150 ease-out md:hidden", PRESS,
                  dark ? "text-white hover:bg-white/10" : "hover:bg-ink/5")}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Collapse open={open} className="md:hidden">
            <div className="space-y-1 px-3 pb-4 pt-1">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} className="block rounded-2xl px-3 py-3 text-base font-medium hover:bg-ink/5">{n.label}</Link>
              ))}
              <LinkButton to={cta.to} size="lg" className="mt-2 w-full">{cta.label}</LinkButton>
            </div>
          </Collapse>
        </div>
      </header>

      <main className={cx("flex-1", !isHome && "pt-24")}>
        <Outlet context={config} />
      </main>

      <footer className="bg-[#06120c] text-white/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo light />
            <p className="max-w-xs text-sm leading-relaxed">
              A free, practical AI course for Nigerians. "Akada" is what we call someone who loves to learn.
            </p>
          </div>
          {[
            { title: "Course", links: [["/#path", "Curriculum"], ["/showcase", "Project showcase"], ["/demo-day", "Demo day"], ["/verify", "Check a certificate"]] },
            { title: "Get started", links: [["/try", "Train your first AI"], ["/apply", "Apply"], ["/find-my-link", "Find my link"]] },
            { title: "About", links: [["/privacy", "Privacy notice"], ["/admin", "Team sign in"]] },
          ].map((col) => (
            <div key={col.title} className="space-y-2.5 text-sm">
              <p className="font-semibold text-white">{col.title}</p>
              {col.links.map(([to, label]) => <Link key={to} to={to} className="block transition-[color] duration-150 hover:text-white">{label}</Link>)}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">© {new Date().getFullYear()} Akada Labs</div>
      </footer>
    </div>
  );
}
