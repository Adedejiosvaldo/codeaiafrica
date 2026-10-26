import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, ExternalLink, Rocket, Users, Video } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { usePublicConfig } from "../../components/PublicLayout";
import { AButton, Button, Card, Field, LinkButton, TextInput } from "../../components/ui";

const AGENDA = [
  ["5 min", "Welcome", "What the cohort did, in numbers"],
  ["60 min", "Live demos", "Each learner shows their AI tool working, then takes a question"],
  ["10 min", "Guest remarks", "An AI practitioner, funder or community partner"],
  ["10 min", "Certificates", "Celebrating the cohort, and what's next"],
];

export default function DemoDay() {
  const config = usePublicConfig();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <section className="relative overflow-hidden rounded-[32px] bg-[#06120c] px-6 py-14 text-white sm:px-12">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgb(246_196_83/0.3),transparent)]" />
        <p className="text-sm font-semibold text-sun-300">Free and open to everyone</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl">Akada Labs demo day</h1>
        <p className="mt-4 max-w-xl text-lg text-white/70">
          Watch new AI builders from across Nigeria show tools they built in 12 weeks, live. Come to cheer them on, hire, partner or fund.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-white/80">
          <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sun-300" aria-hidden /> {config?.demo_day || "Date to be announced"}</li>
          <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-sun-300" aria-hidden /> 90 minutes</li>
          <li className="flex items-center gap-2"><Video className="h-4 w-4 text-sun-300" aria-hidden /> Online</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <AButton href="#register" variant="sun" size="lg">Register to watch <ArrowRight className="h-4 w-4" aria-hidden /></AButton>
          <LinkButton to="/showcase" variant="ghost" size="lg" className="border border-white/15 text-white hover:bg-white/10 hover:text-white">See the projects</LinkButton>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold">What happens</h2>
          <ol className="mt-5 space-y-4">
            {AGENDA.map(([time, title, text]) => (
              <li key={title} className="flex gap-4">
                <span className="w-16 shrink-0 pt-0.5 font-mono text-sm font-semibold text-brand-700">{time}</span>
                <span><span className="block font-semibold">{title}</span><span className="text-ink-soft">{text}</span></span>
              </li>
            ))}
          </ol>
        </Card>
        <RegisterForm />
      </div>
    </div>
  );
}

function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", organisation: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ status: "idle" | "busy" | "done"; message?: string }>({ status: "idle" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "busy" });
    try {
      const r = await api.post<{ message: string }>("/demo-day/register", form);
      setState({ status: "done", message: r.message });
    } catch (err) {
      setErrors((err as ApiError).errors);
      if (!Object.keys((err as ApiError).errors).length) setErrors({ form: (err as ApiError).message });
      setState({ status: "idle" });
    }
  }

  return (
    <Card id="register" className="scroll-mt-28 p-6 sm:p-8">
      <div className="flex items-center gap-2"><Users className="h-5 w-5 text-brand-600" aria-hidden /><h2 className="text-2xl font-bold">Register to watch</h2></div>
      {state.status === "done" ? (
        <p className="mt-4 flex gap-2 text-ink-soft"><CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" aria-hidden /> {state.message}</p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <Field label="Name" htmlFor="dd-name" error={errors.name}><TextInput id="dd-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></Field>
          <Field label="Email" htmlFor="dd-email" error={errors.email}><TextInput id="dd-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></Field>
          <Field label="Organisation" htmlFor="dd-org" optional><TextInput id="dd-org" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></Field>
          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>Email me the demo day link. See the <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-brand-700 underline">privacy notice</a>.</span>
          </label>
          {(errors.consent || errors.form) && <p className="text-sm font-medium text-clay-700" role="alert">{errors.consent || errors.form}</p>}
          <Button type="submit" size="lg" className="w-full" loading={state.status === "busy"}>Register</Button>
        </form>
      )}
    </Card>
  );
}

export function Showcase() {
  const { data } = useApi<{ cohort: string; demo_day: string; items: { id: number; maker: string; title: string; description: string; brief: string; url: string | null }[] }>("/showcase");
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-sm font-semibold text-brand-600">Built at Akada Labs</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Project showcase</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">AI tools built by learners in 12 weeks, from their first line of Python. Try them yourself.</p>
      {!data ? <div className="mt-10 h-64 animate-pulse rounded-2xl bg-card" /> : data.items.length === 0 ? (
        <Card className="mt-10 grid place-items-center gap-2 px-6 py-16 text-center">
          <Rocket className="h-8 w-8 text-sun-500" aria-hidden />
          <p className="font-display text-xl font-bold">Projects are on their way</p>
          <p className="max-w-sm text-ink-soft">{data.cohort} learners are building now. Their projects appear here as they go live{data.demo_day ? `, in time for demo day on ${data.demo_day}` : ""}.</p>
          <LinkButton to="/demo-day" variant="secondary" className="mt-3">About demo day</LinkButton>
        </Card>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((p) => (
            <Card key={p.id} className="flex flex-col p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{p.brief}</p>
              <h2 className="mt-2 text-xl font-bold">{p.title}</h2>
              <p className="mt-2 flex-1 text-ink-soft">{p.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium">by {p.maker}</span>
                {p.url ? <AButton href={p.url} target="_blank" rel="noopener" size="sm" variant="secondary">Try it <ExternalLink className="h-3.5 w-3.5" aria-hidden /></AButton>
                  : <span className="text-xs text-ink-faint">Going live soon</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
