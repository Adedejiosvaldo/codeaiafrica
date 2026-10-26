import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, PartyPopper } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { CODED, DEVICES, HOURS, LIVE, OCCUPATIONS, label } from "../../lib/labels";
import { usePublicConfig } from "../../components/PublicLayout";
import { Button, Card, ChoiceGroup, Field, LinkButton, PageLoader, TextArea, TextInput, cx } from "../../components/ui";

type Form = {
  name: string; email: string; whatsapp: string; city: string; country: string;
  is_adult: "" | "yes" | "no"; occupation: string; device: string; live_sessions: string; lab_hours: string;
  coded_before: string; problem: string; commits: "" | "yes" | "no"; website: string; consent: boolean;
};
const EMPTY: Form = {
  name: "", email: "", whatsapp: "", city: "", country: "Nigeria", is_adult: "", occupation: "", device: "",
  live_sessions: "", lab_hours: "", coded_before: "", problem: "", commits: "", website: "", consent: false,
};
const DRAFT_KEY = "akada-application-draft";

const STEPS = [
  { title: "About you", fields: ["name", "email", "whatsapp", "city", "country", "is_adult", "occupation"] },
  { title: "Your setup", fields: ["device", "live_sessions", "lab_hours", "coded_before"] },
  { title: "Your idea", fields: ["problem", "commits", "consent"] },
  { title: "Check and send", fields: [] },
] as const;

const opts = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));

function validate(f: Form, fields: readonly string[]) {
  const e: Record<string, string> = {};
  const need = (k: keyof Form, msg: string) => fields.includes(k) && !String(f[k]).trim() && (e[k] = msg);
  need("name", "Tell us your name.");
  need("email", "We need an email to reply to you.");
  if (fields.includes("email") && f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email address.";
  need("whatsapp", "We send cohort updates on WhatsApp.");
  if (fields.includes("whatsapp") && f.whatsapp && f.whatsapp.replace(/\D/g, "").length < 7) e.whatsapp = "Enter a full phone number.";
  need("city", "Which city are you in?");
  need("country", "Which country?");
  need("is_adult", "Please answer this.");
  need("occupation", "Pick the closest option.");
  need("device", "Pick the device you'll use most.");
  need("live_sessions", "Please answer this.");
  need("lab_hours", "Please answer this.");
  need("coded_before", "Please answer this. Any answer is fine.");
  if (fields.includes("problem") && f.problem.trim().length < 10) e.problem = "Write a sentence or two about the problem.";
  need("commits", "Please answer this.");
  if (fields.includes("consent") && !f.consent) e.consent = "Please agree to the privacy notice so we can process your application.";
  return e;
}

export default function Apply() {
  const config = usePublicConfig();
  const [form, setForm] = useState<Form>(() => {
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") }; } catch { return EMPTY; }
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, website: "", consent: false })); } catch { /* private mode */ }
  }, [form]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, done]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    if (k === "consent") { setForm((f) => ({ ...f, consent: v as boolean })); setErrors((e) => { const { consent: _, ...rest } = e; return rest; }); return; }
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const { [k]: _, ...rest } = e; return rest; });
  };

  function next() {
    const e = validate(form, STEPS[step].fields);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
    else document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (step < STEPS.length - 1) return next();
    setSubmitting(true);
    setServerError("");
    try {
      await api.post("/applications", { ...form, is_adult: form.is_adult === "yes", commits: form.commits === "yes" });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setDone(true);
    } catch (err) {
      const e = err as ApiError;
      setServerError(e.message);
      if (Object.keys(e.errors).length) {
        setErrors(e.errors);
        const first = STEPS.findIndex((s) => s.fields.some((f) => f in e.errors));
        if (first >= 0) setStep(first);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!config) return <PageLoader />;

  if (!config.applications_open && !done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sun-100 text-[#8a5d00]"><Lock className="h-6 w-6" aria-hidden /></span>
        <h1 className="mt-5 text-3xl font-bold">Applications aren't open yet</h1>
        <p className="mt-3 text-lg text-ink-soft">Join the waitlist and we'll tell you the day they open.</p>
        <LinkButton to="/#waitlist" size="lg" className="mt-6">Join the waitlist</LinkButton>
      </div>
    );
  }

  if (done) {
    return (
      <div className="animate-rise mx-auto max-w-lg px-4 py-24 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600"><PartyPopper className="h-8 w-8" aria-hidden /></span>
        <h1 className="mt-5 text-3xl font-bold">Application sent. Well done, {form.name.split(" ")[0]}!</h1>
        <p className="mt-3 text-lg text-ink-soft">
          We'll reply to <b className="text-ink">{form.email}</b> and on WhatsApp
          {config.applications_close ? ` after applications close on ${config.applications_close}` : " soon"}.
        </p>
        <Card className="mt-8 p-5 text-left">
          <p className="font-semibold">While you wait</p>
          <p className="mt-1 text-ink-soft">Train your first AI in 10 minutes. It's the same idea as week 1 of the course.</p>
          <LinkButton to="/try" variant="secondary" className="mt-4">Try it now <ArrowRight className="h-4 w-4" aria-hidden /></LinkButton>
        </Card>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-600">{config.cohort_name} application</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Apply to Akada Labs</h1>
      <p className="mt-2 text-ink-soft">5 minutes. We choose people for commitment, not certificates.</p>

      <div className="mt-8">
        <div className="flex justify-between text-sm font-semibold">
          <span>Step {step + 1} of {STEPS.length}: {STEPS[step].title}</span>
          <span className="text-ink-faint">{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-line">
          <div className="h-2 rounded-full bg-brand-500 motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <Card className="mt-6 space-y-7 p-5 sm:p-8">
          {step === 0 && (
            <>
              <Field label="Full name" htmlFor="f-name" error={errors.name}>
                <TextInput id="f-name" value={form.name} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} autoComplete="name" />
              </Field>
              <div className="grid gap-7 sm:grid-cols-2">
                <Field label="Email" htmlFor="f-email" error={errors.email}>
                  <TextInput id="f-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} invalid={!!errors.email} autoComplete="email" />
                </Field>
                <Field label="WhatsApp number" htmlFor="f-whatsapp" error={errors.whatsapp}>
                  <TextInput id="f-whatsapp" type="tel" inputMode="tel" placeholder="0803 123 4567" value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)} invalid={!!errors.whatsapp} autoComplete="tel" />
                </Field>
              </div>
              <div className="grid gap-7 sm:grid-cols-2">
                <Field label="City" htmlFor="f-city" error={errors.city}>
                  <TextInput id="f-city" value={form.city} onChange={(e) => set("city", e.target.value)} invalid={!!errors.city} autoComplete="address-level2" />
                </Field>
                <Field label="Country" htmlFor="f-country" error={errors.country}>
                  <TextInput id="f-country" value={form.country} onChange={(e) => set("country", e.target.value)} invalid={!!errors.country} autoComplete="country-name" />
                </Field>
              </div>
              <Field label="Are you 18 or older?" error={errors.is_adult}>
                <ChoiceGroup name="is_adult" columns={2} value={form.is_adult} invalid={!!errors.is_adult}
                  options={[{ value: "yes", label: "Yes, I'm 18 or older" }, { value: "no", label: "No" }]}
                  onChange={(v) => set("is_adult", v as Form["is_adult"])} />
              </Field>
              <Field label="What best describes you?" error={errors.occupation}>
                <ChoiceGroup name="occupation" columns={2} value={form.occupation} options={opts(OCCUPATIONS)}
                  invalid={!!errors.occupation} onChange={(v) => set("occupation", v)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Which device will you use?" hint="Any answer is OK. It helps us plan support." error={errors.device}>
                <ChoiceGroup name="device" columns={2} value={form.device} options={opts(DEVICES)}
                  invalid={!!errors.device} onChange={(v) => set("device", v)} />
              </Field>
              <Field label="Can you attend a live 60-minute session on Saturday mornings for 12 weeks?" error={errors.live_sessions}>
                <ChoiceGroup name="live" value={form.live_sessions} options={opts(LIVE)} invalid={!!errors.live_sessions}
                  onChange={(v) => set("live_sessions", v)} />
              </Field>
              <Field label="How many hours a week can you give to labs?" error={errors.lab_hours}>
                <ChoiceGroup name="hours" value={form.lab_hours} options={opts(HOURS)} invalid={!!errors.lab_hours}
                  onChange={(v) => set("lab_hours", v)} />
              </Field>
              <Field label="Have you written any code before?" hint="This doesn't affect your chances. The course is for beginners." error={errors.coded_before}>
                <ChoiceGroup name="coded" columns={2} value={form.coded_before} options={opts(CODED)} invalid={!!errors.coded_before}
                  onChange={(v) => set("coded_before", v)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="What problem would you like to solve with AI?" htmlFor="f-problem" error={errors.problem}
                hint="One or two sentences, in your own words. Specific problems you've seen up close stand out.">
                <TextArea id="f-problem" rows={5} maxLength={600} value={form.problem} invalid={!!errors.problem}
                  placeholder="For example: traders in my market can't tell when rice prices will jump, so they buy at the wrong time."
                  onChange={(e) => set("problem", e.target.value)} />
                <p className="text-right text-xs text-ink-faint">{form.problem.length} / 600</p>
              </Field>
              <Field label="Will you commit to submitting 9 of the 12 labs?" error={errors.commits}>
                <ChoiceGroup name="commits" columns={2} value={form.commits} invalid={!!errors.commits}
                  options={[{ value: "yes", label: "Yes, I commit" }, { value: "no", label: "No" }]}
                  onChange={(v) => set("commits", v as Form["commits"])} />
              </Field>
              <div>
                <label className={cx("flex cursor-pointer items-start gap-3 rounded-xl border bg-card px-4 py-3.5 transition-[border-color] duration-150",
                  errors.consent ? "border-clay-500" : "border-line-strong")}>
                  <input id="f-consent" type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-600" aria-invalid={!!errors.consent || undefined} />
                  <span className="text-[15px] text-ink-soft">
                    I agree that Akada Labs can use my answers to review my application and contact me, as explained in the{" "}
                    <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-brand-700 underline">privacy notice</a>.
                  </span>
                </label>
                {errors.consent && <p className="mt-1.5 text-sm font-medium text-clay-700" role="alert">{errors.consent}</p>}
              </div>
              <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={form.website}
                onChange={(e) => set("website", e.target.value)} />
            </>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {[
                { title: "About you", step: 0, rows: [["Name", form.name], ["Email", form.email], ["WhatsApp", form.whatsapp],
                  ["Location", `${form.city}, ${form.country}`], ["18 or older", form.is_adult === "yes" ? "Yes" : "No"],
                  ["Describes you", label(OCCUPATIONS, form.occupation)]] },
                { title: "Your setup", step: 1, rows: [["Device", label(DEVICES, form.device)], ["Saturday sessions", label(LIVE, form.live_sessions)],
                  ["Lab hours a week", label(HOURS, form.lab_hours)], ["Coded before", label(CODED, form.coded_before)]] },
                { title: "Your idea", step: 2, rows: [["Problem", form.problem], ["Commit to 9 labs", form.commits === "yes" ? "Yes" : "No"]] },
              ].map((section) => (
                <div key={section.title}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{section.title}</h2>
                    <button type="button" className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setStep(section.step)}>Edit</button>
                  </div>
                  <dl className="mt-2 divide-y divide-line rounded-xl border border-line">
                    {section.rows.map(([k, v]) => (
                      <div key={k} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[170px_1fr]">
                        <dt className="text-sm text-ink-soft">{k}</dt>
                        <dd className="text-[15px] font-medium [overflow-wrap:anywhere]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              {(form.is_adult === "no" || form.commits === "no") && (
                <p className="rounded-xl bg-sun-100 px-4 py-3 text-sm text-[#6b4a00]">
                  This cohort is for people who are 18 or older and can commit to 9 labs. You can still send your
                  application, but we won't be able to offer you a place this time.
                </p>
              )}
            </div>
          )}

          {serverError && (
            <p className="rounded-xl bg-clay-50 px-4 py-3 text-sm font-medium text-clay-700" role="alert">{serverError}</p>
          )}
        </Card>

        <div className={cx("mt-6 flex items-center gap-3", step === 0 ? "justify-end" : "justify-between")}>
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="submit" size="lg">Continue <ArrowRight className="h-4 w-4" aria-hidden /></Button>
          ) : (
            <Button type="submit" size="lg" loading={submitting}>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Send application
            </Button>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">Your answers are saved on this device until you send them.</p>
      </form>
    </div>
  );
}
