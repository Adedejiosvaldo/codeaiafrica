import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight, Banknote, BookOpenCheck, CalendarDays, CheckCircle2, ChevronDown, FileSearch, Laptop, MessageCircle,
  Rocket, Sparkles, Store, Users, Wifi,
} from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Week } from "../../lib/types";
import { usePublicConfig } from "../../components/PublicLayout";
import { Badge, Button, Card, Collapse, cx, LinkButton, TextInput } from "../../components/ui";

export default function Home() {
  const config = usePublicConfig();
  const open = config?.applications_open;
  const places = config?.places ?? 40;

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-sun-300/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-32 top-48 h-[380px] w-[380px] rounded-full bg-brand-200/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <div className="animate-rise">
            <Badge tone="brand" className="mb-5 py-1 text-[13px]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Free · 12 weeks · {places} places
            </Badge>
            <h1 className="text-[42px] font-extrabold leading-[1.02] sm:text-6xl lg:text-[68px]">
              Learn AI by <span className="relative whitespace-nowrap text-brand-700">building it<svg aria-hidden viewBox="0 0 200 12" className="absolute -bottom-1 left-0 h-3 w-full text-sun-300" preserveAspectRatio="none"><path d="M2 9c50-6 120-8 196-4" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" /></svg></span>.
              <br className="hidden sm:block" /> Right in your browser.
            </h1>
            </div>
            <p className="animate-rise stagger-1 mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              In 12 weeks you'll build and deploy an AI tool that solves a real Nigerian problem. No fees,
              nothing to install, and no expensive laptop needed.
            </p>
            <div className="animate-rise stagger-2 mt-8 flex flex-wrap gap-3">
              <LinkButton to={open ? "/apply" : "/#waitlist"} size="lg">
                {open ? "Apply now" : "Join the waitlist"} <ArrowRight className="h-4 w-4" aria-hidden />
              </LinkButton>
              <LinkButton to="/try" size="lg" variant="secondary">Train your first AI in 10 minutes</LinkButton>
            </div>
            {open && config?.applications_close && (
              <p className="mt-4 text-sm font-medium text-ink-soft">Applications close {config.applications_close}.</p>
            )}
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* ---------------------------------------------------------------- facts */}
      <section className="border-y border-line bg-card">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-line px-4 sm:px-6 md:grid-cols-4 md:divide-x">
          {[
            ["12", "weeks, Saturday mornings"],
            [String(places), "places in this cohort"],
            ["₦0", "to join. It's free"],
            ["0", "things to install"],
          ].map(([n, l]) => (
            <div key={l} className="px-2 py-6 md:px-6">
              <dt className="font-display text-4xl font-bold text-brand-700">{n}</dt>
              <dd className="mt-1 text-sm text-ink-soft">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------------------------------------------------------- how */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="How it works" title="Real skills, the practical way" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: CalendarDays, title: "Learn live, together", body: "A 60-minute live session every Saturday morning, plus a WhatsApp group of 40 people learning with you." },
            { icon: BookOpenCheck, title: "Labs that check themselves", body: "Every exercise tells you PASS or gives you a hint, right away. Finish a lab and you get a completion code." },
            { icon: Rocket, title: "Ship something real", body: "By week 11 your AI tool is live on the internet. On demo day you show it to the public, funders and employers." },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" aria-hidden /></span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- course */}
      <section id="course" className="scroll-mt-20 bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="The 12 weeks" title="From your first line of Python to a live AI tool" light />
          <Curriculum />
        </div>
      </section>

      {/* ---------------------------------------------------------------- capstones */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Your capstone" title="Pick a Nigerian problem. Build the fix."
          body="Choose one of these briefs in week 9, or bring your own idea." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            { icon: MessageCircle, title: "Pidgin sentiment checker", body: "Labels customer messages as positive, negative or neutral, in Pidgin or English." },
            { icon: Store, title: "Market price agent", body: "Answers \"how has rice price changed in Kano?\" by looking up real price data." },
            { icon: FileSearch, title: "Ask-the-law bot", body: "Answers questions about the Nigeria Data Protection Act, and shows where it found each answer." },
            { icon: Banknote, title: "Bank alert parser", body: "Turns pasted SMS alerts into a clean monthly spending table." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="group flex gap-4 rounded-2xl border border-transparent bg-card p-5 shadow-soft transition-[box-shadow] duration-150 ease-out hover:shadow-lift">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sun-100 text-[#8a5d00]"><Icon className="h-5 w-5" aria-hidden /></span>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-ink-soft">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- who */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Who it's for" title="Curious about AI? You're who we built this for." />
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              You don't need to have coded before. We pick people for commitment, not certificates.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              { icon: Users, text: "18 or older, living in Nigeria" },
              { icon: CalendarDays, text: "Free for a 60-minute live session on Saturday mornings" },
              { icon: BookOpenCheck, text: "About 2–4 hours a week for labs, and you'll finish 9 of the 12" },
              { icon: Laptop, text: "A laptop helps. A shared laptop or cyber café works too" },
              { icon: Wifi, text: "An internet connection. Wi-Fi helps for the first lab download" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
                <Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- cta */}
      <section id="waitlist" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-brand-700 px-6 py-12 text-white sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sun-300/30 blur-2xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                {open ? `${places} places. Free. Applications are open.` : "Be first to hear when applications open."}
              </h2>
              <p className="mt-3 text-lg text-white/80">
                {open
                  ? `The form takes 5 minutes.${config?.applications_close ? ` It closes ${config.applications_close}.` : ""}`
                  : "Leave your email and we'll tell you the day the next cohort opens."}
              </p>
            </div>
            {open ? (
              <LinkButton to="/apply" size="lg" variant="sun" className="justify-self-start lg:justify-self-end">
                Start your application <ArrowRight className="h-4 w-4" aria-hidden />
              </LinkButton>
            ) : (
              <WaitlistForm />
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- faq */}
      <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <SectionTitle eyebrow="Questions" title="Things people ask" center />
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-card">
          {FAQ.map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
        </div>
      </section>
    </>
  );
}

const FAQ: [string, string][] = [
  ["Is it really free?", "Yes. No fees, no hidden costs. The tools we use all have free tiers."],
  ["I've never written code. Can I still join?", "Yes. Week 2 starts from the very first line of Python. We don't score prior coding experience when we choose people."],
  ["Can I do it on my phone?", "You can follow the live sessions and some labs on a phone, but labs are much easier on a laptop. A shared laptop or a cyber café is fine."],
  ["How much data will it use?", "The first time you open the browser lab it downloads Python, which is the biggest download of the course, so use Wi-Fi if you can. After that the labs are light. Live sessions are about 60 minutes of video a week."],
  ["What do I get at the end?", "A live AI tool you built yourself, a demo in front of a public audience, and a certificate if you complete 9 of the 12 labs."],
  ["How are people chosen?", "We look at whether you can make the live sessions, how many hours you can give, your device, and the problem you want to solve. Specific, personal answers score best."],
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[17px] font-semibold"
        onClick={() => setOpen(!open)} aria-expanded={open}>
        {q}
        <ChevronDown className={cx("h-5 w-5 shrink-0 text-ink-faint motion-safe:transition-[rotate] motion-safe:duration-150 motion-safe:ease-out", open && "rotate-180")} aria-hidden />
      </button>
      <Collapse open={open}><p className="px-5 pb-5 leading-relaxed text-ink-soft">{a}</p></Collapse>
    </div>
  );
}

function SectionTitle({ eyebrow, title, body, light, center }:
  { eyebrow: string; title: string; body?: string; light?: boolean; center?: boolean }) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      <p className={cx("text-sm font-bold uppercase tracking-[0.14em]", light ? "text-sun-300" : "text-brand-600")}>{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-[40px]">{title}</h2>
      {body && <p className={cx("mt-3 text-lg", light ? "text-white/75" : "text-ink-soft")}>{body}</p>}
    </div>
  );
}

const PHASES = [
  { name: "Foundations", weeks: [1, 2, 3, 4, 5], note: "In your browser" },
  { name: "Modern AI", weeks: [6, 7, 8, 9, 10], note: "On Kaggle or Colab, free GPUs" },
  { name: "Ship it", weeks: [11, 12], note: "Live on the internet" },
];

function Curriculum() {
  const { data } = useApi<{ weeks: Week[] }>("/public/course");
  if (!data) return <div className="mt-10 h-96 animate-pulse rounded-2xl bg-white/5" />;
  const byWeek = Object.fromEntries(data.weeks.map((w) => [w.week, w]));
  return (
    <div className="mt-12 space-y-10">
      {PHASES.map((p) => (
        <div key={p.name}>
          <div className="mb-4 flex items-baseline gap-3">
            <h3 className="text-xl font-bold">{p.name}</h3>
            <span className="text-sm text-white/60">{p.note}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {p.weeks.map((n) => {
              const w = byWeek[n];
              return (
                <div key={n} className={cx("rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.08]",
                  n === 5 && "ring-1 ring-sun-300/50")}>
                  <p className="text-xs font-bold uppercase tracking-wider text-sun-300">Week {n}</p>
                  <p className="mt-1.5 font-display text-lg font-semibold leading-snug">{w.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">{w.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<{ status: "idle" | "busy" | "done" | "error"; message?: string }>({ status: "idle" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "busy" });
    try {
      const r = await api.post<{ message: string }>("/waitlist", { email, website });
      setState({ status: "done", message: r.message });
    } catch (err) {
      setState({ status: "error", message: (err as ApiError).errors?.email ?? (err as ApiError).message });
    }
  }

  if (state.status === "done") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-sun-300" aria-hidden />
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="wl-email" className="sr-only">Email address</label>
        <TextInput id="wl-email" type="email" required placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} className="border-transparent sm:flex-1" autoComplete="email" />
        <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)}
          className="hidden" aria-hidden />
        <Button type="submit" variant="sun" size="lg" loading={state.status === "busy"}>Join the waitlist</Button>
      </div>
      {state.status === "error" && <p className="text-sm font-medium text-sun-100" role="alert">{state.message}</p>}
    </form>
  );
}

function HeroVisual() {
  return (
    <div className="animate-rise stagger-3 relative mx-auto w-full max-w-md lg:max-w-none">
      <Card className="overflow-hidden shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-line bg-paper px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-clay-500/70" />
          <span className="h-3 w-3 rounded-full bg-sun-300" />
          <span className="h-3 w-3 rounded-full bg-brand-500/70" />
          <span className="ml-3 truncate text-xs font-medium text-ink-faint">week02-python-in-the-browser.ipynb</span>
        </div>
        <div className="space-y-3 p-4 font-mono text-[13px] leading-relaxed">
          <p className="font-sans text-sm font-semibold text-ink">Exercise 4: Write a function</p>
          <div className="whitespace-pre rounded-xl bg-paper p-3.5">
            <span className="text-brand-700">def</span> <span className="text-[#7a5300]">air_label</span>(pm25):
            <br />{"    "}<span className="text-brand-700">if</span> pm25 &gt; 35:
            <br />{"        "}<span className="text-brand-700">return</span> <span className="text-clay-700">"poor"</span>
            <br />{"    "}<span className="text-brand-700">return</span> <span className="text-clay-700">"good"</span>
          </div>
          <div className="rounded-xl border border-line p-3.5">
            <span className="text-ink-faint">check.week2.check_4(air_label)</span>
            <div className="mt-1.5 flex items-center gap-1.5 font-sans text-sm font-semibold text-brand-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> PASS: exercise 4 done.
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-paper p-3.5 font-sans">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-medium text-ink-soft"><span>This lab</span><span>4 of 5</span></div>
              <div className="mt-1.5 h-2 rounded-full bg-line"><div className="h-2 w-4/5 rounded-full bg-brand-500" /></div>
            </div>
          </div>
        </div>
      </Card>
      <Card className="absolute -bottom-6 -left-4 hidden items-center gap-3 px-4 py-3 shadow-lift sm:flex">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-sun-100 text-[#8a5d00]"><Sparkles className="h-5 w-5" aria-hidden /></span>
        <div>
          <p className="text-sm font-bold">Real Lagos sensor data</p>
          <p className="text-xs text-ink-soft">Every lab uses Nigerian datasets</p>
        </div>
      </Card>
    </div>
  );
}
