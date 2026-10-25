import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowRight, Banknote, BookOpenCheck, CalendarDays, Check, CheckCircle2, ChevronDown, Clock, Code2, FileSearch,
  GitFork, Laptop, MessageCircle, Rocket, Star, Store, Users, Video, Wifi,
} from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Week } from "../../lib/types";
import { usePublicConfig } from "../../components/PublicLayout";
import { AppMock, DashboardMock, NotebookMock, Window } from "../../components/showcase";
import { Button, Collapse, LinkButton, TextInput, cx } from "../../components/ui";

export default function Home() {
  const config = usePublicConfig();
  const open = config?.applications_open ?? false;
  const places = config?.places ?? 40;
  const starts = config?.start_date ? new Date(config.start_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-[#06120c] pb-10 pt-32 text-white sm:pt-40">
        <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-280px] h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(19_138_87/0.55),transparent)]" />
        <div aria-hidden className="pointer-events-none absolute right-[-120px] top-40 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgb(246_196_83/0.18),transparent)]" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="animate-rise">
            <LinkButton to={open ? "/apply" : "/#waitlist"} variant="ghost" size="sm" static
              className="mx-auto h-auto gap-2 border border-white/15 bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white">
              <span className="rounded-full bg-sun-300 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-900">{open ? "Open" : "Soon"}</span>
              {open ? `${config?.cohort_name ?? "Cohort 1"} applications are open` : "Next cohort: join the waitlist"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </LinkButton>
            <h1 className="mt-7 text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-7xl lg:text-[84px]">
              Learn AI by <span className="whitespace-nowrap">building it.</span>
            </h1>
          </div>
          <p className="animate-rise stagger-1 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
            A free 12-week course where you go from your first line of Python to an AI tool live on the internet,
            solving a real Nigerian problem. Nothing to install.
          </p>
          <div className="animate-rise stagger-2 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton to={open ? "/apply" : "/#waitlist"} variant="sun" size="lg" className="w-full sm:w-auto">
              {open ? "Apply free" : "Join the waitlist"} <ArrowRight className="h-4 w-4" aria-hidden />
            </LinkButton>
            <LinkButton to="/try" variant="ghost" size="lg"
              className="w-full border border-white/15 text-white hover:bg-white/10 hover:text-white sm:w-auto">
              <Play10 /> Train an AI in 10 minutes
            </LinkButton>
          </div>
          <ul className="animate-rise stagger-2 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/55">
            <li className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-sun-300" aria-hidden /> 12 weeks{starts ? `, from ${starts}` : ""}</li>
            <li className="flex items-center gap-1.5"><Users className="h-4 w-4 text-sun-300" aria-hidden /> {places} places</li>
            <li className="flex items-center gap-1.5"><Banknote className="h-4 w-4 text-sun-300" aria-hidden /> ₦0, always</li>
            <li className="flex items-center gap-1.5"><Laptop className="h-4 w-4 text-sun-300" aria-hidden /> Runs in your browser</li>
          </ul>
        </div>

        <div className="animate-rise stagger-3 relative mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <Showcase />
        </div>
      </section>

      {/* ---------------------------------------------------------------- tools */}
      <section className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:justify-between">
          <p className="shrink-0 text-sm font-medium text-ink-soft">The same tools working AI engineers use</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-display text-lg font-semibold text-ink/45 sm:text-xl">
            {["Python", "pandas", "scikit-learn", "PyTorch", "Kaggle", "Hugging Face", "Gradio"].map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- how */}
      <section id="how" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle eyebrow="How it works" title="You learn AI the way engineers do: by shipping it" />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Feature icon={<Video className="h-5 w-5" />} kicker="Every Saturday" title="Learn live, together"
            body="A 60-minute live session each week, then a WhatsApp group where TAs and classmates answer your questions." />
          <Feature icon={<BookOpenCheck className="h-5 w-5" />} kicker="Hands-on labs" title="Code that checks itself"
            body="Every exercise tells you PASS or gives a hint the moment you run it. Finish a lab, get a completion code." />
          <Feature icon={<Rocket className="h-5 w-5" />} kicker="Week 11" title="Ship a real product"
            body="Your capstone goes live on Hugging Face. On demo day you show it to the public, funders and employers." />
        </div>
      </section>

      {/* ---------------------------------------------------------------- path */}
      <section id="path" className="scroll-mt-24 border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionTitle eyebrow="Curriculum" title="One path, twelve weeks"
            body="Pick any week to see what you'll do. Every lab uses Nigerian data." />
          <LearningPath />
        </div>
      </section>

      {/* ---------------------------------------------------------------- projects */}
      <section id="projects" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle eyebrow="Capstone" title="Pick a Nigerian problem. Ship the fix."
          body="Choose a brief in week 9 or bring your own idea. Here's what you could build." />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {[
            { icon: MessageCircle, repo: "pidgin-sentiment-checker", body: "Labels customer messages as positive, negative or neutral, in Pidgin or English.", tags: ["NLP", "LLM API"], weeks: "Weeks 5 & 7" },
            { icon: Store, repo: "market-price-agent", body: "Answers \"how has rice price changed in Kano?\" by calling a price-lookup tool.", tags: ["Agents", "pandas"], weeks: "Weeks 3 & 10" },
            { icon: FileSearch, repo: "ask-the-law", body: "Answers questions about the Nigeria Data Protection Act, citing the sections it used.", tags: ["RAG", "Embeddings"], weeks: "Weeks 8 & 9" },
            { icon: Banknote, repo: "bank-alert-parser", body: "Turns pasted bank SMS alerts into a clean monthly spending table.", tags: ["LLM API", "JSON"], weeks: "Week 7" },
          ].map(({ icon: Icon, repo, body, tags, weeks }) => (
            <article key={repo} className="group rounded-2xl border border-transparent bg-card p-6 shadow-soft transition-[box-shadow] duration-150 ease-out hover:shadow-lift">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" aria-hidden /></span>
                  <p className="truncate font-mono text-[15px] font-semibold text-brand-700">you/<span className="text-ink">{repo}</span></p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-line sm:inline-flex">
                  <Star className="h-3.5 w-3.5" aria-hidden /> Brief
                </span>
              </div>
              <p className="mt-4 leading-relaxed text-ink-soft">{body}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
                {tags.map((t, i) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className={cx("h-2.5 w-2.5 rounded-full", i ? "bg-sun-500" : "bg-brand-500")} aria-hidden /> {t}
                  </span>
                ))}
                <span className="flex items-center gap-1.5"><GitFork className="h-4 w-4" aria-hidden /> {weeks}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- who */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-10 rounded-[32px] bg-brand-50/70 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-14">
          <div>
            <SectionTitle eyebrow="Who it's for" title="Never coded? Good. Start here." />
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              We pick people for commitment, not certificates. Prior coding isn't scored, and there's no fee at any point.
            </p>
            <LinkButton to="/try" variant="secondary" className="mt-6">Not sure? Try a 10-minute lesson <ArrowRight className="h-4 w-4" aria-hidden /></LinkButton>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Users, title: "18 or older", text: "Living in Nigeria" },
              { icon: CalendarDays, title: "Saturday mornings", text: "60 minutes live, for 12 weeks" },
              { icon: Clock, title: "2–4 hours a week", text: "For labs; finish 9 of the 12" },
              { icon: Laptop, title: "A laptop helps", text: "Shared laptop or cyber café works too" },
              { icon: Wifi, title: "Internet access", text: "Wi-Fi helps for the first lab download" },
              { icon: Code2, title: "No experience needed", text: "Week 2 starts from line one" },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <span><span className="block font-semibold">{title}</span><span className="block text-sm text-ink-soft">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- faq */}
      <section id="faq" className="scroll-mt-24 border-t border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionTitle eyebrow="FAQ" title="Questions, answered" />
            <p className="mt-4 text-ink-soft">Anything else? Ask us on WhatsApp once you've applied.</p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- final cta */}
      <section id="waitlist" className="scroll-mt-24 relative overflow-hidden bg-[#06120c] text-white">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-full h-[520px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(19_138_87/0.5),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 sm:py-28">
          <h2 className="text-4xl font-extrabold tracking-[-0.02em] sm:text-6xl">
            {open ? "Your first AI tool is 12 weeks away." : "Be first in line for the next cohort."}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/65">
            {open
              ? `${places} places, free. The application takes 5 minutes${config?.applications_close ? ` and closes ${config.applications_close}` : ""}.`
              : "Leave your email and we'll tell you the day applications open."}
          </p>
          <div className="mx-auto mt-9 max-w-lg">
            {open ? (
              <LinkButton to="/apply" variant="sun" size="lg">Start your application <ArrowRight className="h-4 w-4" aria-hidden /></LinkButton>
            ) : <WaitlistForm />}
          </div>
        </div>
      </section>
    </>
  );
}

/* ================================================================== pieces */

function Play10() {
  return <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15" aria-hidden><span className="ml-0.5 h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-white" /></span>;
}

const TABS = [
  { key: "learn", label: "Learn", title: "Your dashboard shows exactly what's next", url: "akadalabs.org/learn", body: <DashboardMock /> },
  { key: "practise", label: "Practise", title: "Labs run Python right in the browser", url: "akadalabs.org/lab", body: <NotebookMock /> },
  { key: "ship", label: "Ship", title: "Your capstone goes live on the internet", url: "huggingface.co/spaces/you/pidgin-checker", body: <AppMock /> },
] as const;

function Showcase() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("learn");
  const active = TABS.find((t) => t.key === tab)!;
  return (
    <div>
      <div className="mx-auto flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1 backdrop-blur" role="tablist" aria-label="Product tour">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cx("rounded-full px-4 py-1.5 text-sm font-semibold transition-[background-color,color] duration-150",
              tab === t.key ? "bg-white text-ink" : "text-white/65 hover:text-white")}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-white/55">{active.title}</p>
      <div className="relative mt-6">
        <div aria-hidden className="absolute inset-x-10 -bottom-6 top-10 rounded-[28px] bg-brand-500/25 blur-3xl" />
        <Window url={active.url} className="relative">{active.body}</Window>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 text-[34px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-5xl">{title}</h2>
      {body && <p className="mt-4 text-lg text-ink-soft">{body}</p>}
    </div>
  );
}

function Feature({ icon, kicker, title, body }: { icon: ReactNode; kicker: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-transparent bg-card p-6 shadow-soft">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-900 text-sun-300">{icon}</span>
      <p className="mt-5 text-sm font-semibold text-brand-600">{kicker}</p>
      <h3 className="mt-1 text-xl font-bold">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

const PHASES = [
  { name: "Foundations", note: "In your browser", weeks: [1, 2, 3, 4, 5] },
  { name: "Modern AI", note: "Free GPUs on Kaggle", weeks: [6, 7, 8, 9, 10] },
  { name: "Ship it", note: "Live on the internet", weeks: [11, 12] },
];

function LearningPath() {
  const { data } = useApi<{ weeks: Week[] }>("/public/course");
  const [selected, setSelected] = useState(5);
  if (!data) return <div className="mt-12 h-[420px] animate-pulse rounded-2xl bg-paper" />;
  const week = data.weeks.find((w) => w.week === selected)!;
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        {PHASES.map((p, pi) => (
          <div key={p.name}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs font-semibold text-ink-faint">0{pi + 1}</span>
              <h3 className="text-lg font-bold">{p.name}</h3>
              <span className="text-sm text-ink-faint">{p.note}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {p.weeks.map((n) => {
                const w = data.weeks.find((x) => x.week === n)!;
                const on = n === selected;
                return (
                  <button key={n} onClick={() => setSelected(n)} aria-pressed={on}
                    className={cx("rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150",
                      on ? "border-brand-600 bg-brand-900 text-white shadow-lift" : "border-line bg-paper hover:border-line-strong")}>
                    <span className={cx("text-[11px] font-bold uppercase tracking-wider", on ? "text-sun-300" : "text-ink-faint")}>Week {n}</span>
                    <span className="mt-1 block text-[14px] font-semibold leading-snug">{w.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl bg-brand-900 p-6 text-white sm:p-7" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wider text-sun-300">Week {week.week} · {week.phase}</p>
          <h3 className="mt-2 text-2xl font-bold">{week.title}</h3>
          <p className="mt-2 text-white/70">{week.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1"><Laptop className="h-3.5 w-3.5" aria-hidden /> {week.where}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1"><Clock className="h-3.5 w-3.5" aria-hidden /> About {Math.round(week.minutes / 30) / 2} hours</span>
          </div>
          <p className="mt-6 text-sm font-semibold">You'll be able to</p>
          <ul className="mt-3 space-y-2.5">
            {week.objectives.map((o) => (
              <li key={o} className="flex gap-2.5 text-[15px] text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sun-300" aria-hidden /> {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const FAQ: [string, string][] = [
  ["Is it really free?", "Yes. No fees and no hidden costs. Every tool we use has a free tier."],
  ["I've never written code. Can I still join?", "Yes. Week 2 starts from the very first line of Python, and we don't score prior coding experience when we choose people."],
  ["Can I do it on my phone?", "You can join live sessions and some labs on a phone, but labs are much easier on a laptop. A shared laptop or a cyber café is fine."],
  ["How much data will it use?", "The first time you open the browser lab it downloads Python, the biggest download of the course, so use Wi-Fi if you can. After that labs are light. Live sessions are about 60 minutes of video a week."],
  ["What do I get at the end?", "A live AI tool you built yourself, a demo in front of a public audience, and a certificate when you complete 9 of the 12 labs."],
  ["How are people chosen?", "We look at whether you can make the live sessions, the hours you can give, your device, and the problem you want to solve. Specific, personal answers score best."],
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-semibold"
        onClick={() => setOpen(!open)} aria-expanded={open}>
        {q}
        <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[background-color,color] duration-150", open ? "bg-brand-900 text-white" : "bg-paper text-ink-soft")}>
          <ChevronDown className={cx("h-4 w-4 motion-safe:transition-[rotate] motion-safe:duration-150 motion-safe:ease-out", open && "rotate-180")} aria-hidden />
        </span>
      </button>
      <Collapse open={open}><p className="pb-5 pr-12 leading-relaxed text-ink-soft">{a}</p></Collapse>
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
      <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/10 p-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-sun-300" aria-hidden />
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-2 rounded-full sm:flex-row sm:bg-white/10 sm:p-1.5">
        <label htmlFor="wl-email" className="sr-only">Email address</label>
        <TextInput id="wl-email" type="email" required placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email"
          className="rounded-full border-transparent sm:h-11 sm:flex-1 sm:bg-transparent sm:text-white sm:placeholder:text-white/45 sm:focus:ring-0" />
        <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden />
        <Button type="submit" variant="sun" size="lg" className="sm:h-11" loading={state.status === "busy"}>Notify me</Button>
      </div>
      {state.status === "error" && <p className="mt-3 text-sm font-medium text-sun-100" role="alert">{state.message}</p>}
    </form>
  );
}
