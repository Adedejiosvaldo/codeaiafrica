import { useState } from "react";
import { ArrowRight, Camera, Check, ExternalLink, Lightbulb, Share2, Smartphone } from "lucide-react";
import { usePublicConfig } from "../../components/PublicLayout";
import { AButton, Card, LinkButton, cx } from "../../components/ui";

const TM_URL = "https://teachablemachine.withgoogle.com/train/image";
const HANDLE = "@akadalabs";

const STEPS = [
  { title: "Open Teachable Machine", body: "It's a free Google tool. Choose Image Project, then Standard image model.", action: true },
  { title: "Make 2 classes", body: "Rename \"Class 1\" and \"Class 2\" to two things you can show your camera.", ideas: true },
  { title: "Give it about 30 photos of each", body: "Click Webcam and hold the button to snap photos. Move the object around: closer, further, different angles.",
    tip: "On a phone, or no webcam? Click Upload and pick photos from your gallery instead." },
  { title: "Click Train model", body: "Keep the tab open while it trains. It takes under a minute." },
  { title: "Test it live", body: "Show it each object in the Preview panel and watch the bars move. Then try to fool it with something new." },
];

export default function Try() {
  const config = usePublicConfig();
  const [done, setDone] = useState<number[]>([]);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const allDone = done.length === STEPS.length;

  const shareText = `I just trained my first AI in 10 minutes, in my browser. ${HANDLE}`;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const share = [
    { name: "X", href: `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
      <div className="animate-rise text-center">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-600">Free · 10 minutes · no code</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">Train your first AI</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          You'll teach a computer to recognise things through your camera, in your browser.
          No sign-up and no expensive laptop.
        </p>
      </div>

      <div className="mt-10 flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
        <div className="h-2 flex-1 rounded-full bg-line">
          <div className="h-2 rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${(done.length / STEPS.length) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold text-ink-soft">{done.length} of {STEPS.length}</span>
      </div>

      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => {
          const isDone = done.includes(i);
          return (
            <li key={s.title}>
              <Card className={cx("flex gap-4 p-5 transition-colors", isDone && "border-brand-200 bg-brand-50/50")}>
                <button onClick={() => toggle(i)} aria-pressed={isDone} aria-label={isDone ? `Mark step ${i + 1} not done` : `Mark step ${i + 1} done`}
                  className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-bold transition-colors",
                    isDone ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong text-ink-soft hover:border-brand-500")}>
                  {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{s.title}</h2>
                  <p className="mt-1 text-ink-soft">{s.body}</p>
                  {s.ideas && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Naira note / Not money", "Ripe / Unripe plantain", "Thumbs up / Thumbs down", "Pen / Phone"].map((x) => (
                        <span key={x} className="rounded-full bg-sun-100 px-3 py-1 text-sm font-medium text-[#6b4a00]">{x}</span>
                      ))}
                    </div>
                  )}
                  {s.tip && (
                    <p className="mt-3 flex gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-soft">
                      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden /> {s.tip}
                    </p>
                  )}
                  {s.action && (
                    <AButton href={TM_URL} target="_blank" rel="noopener" className="mt-4">
                      <Camera className="h-4 w-4" aria-hidden /> Open Teachable Machine <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    </AButton>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <section className={cx("mt-14 transition-opacity", !allDone && "opacity-95")}>
        <div className="flex items-center gap-2 text-brand-700">
          <Lightbulb className="h-5 w-5" aria-hidden />
          <p className="text-sm font-bold uppercase tracking-[0.14em]">What just happened</p>
        </div>
        <div className="mt-5 space-y-5 text-[17px] leading-relaxed text-ink-soft">
          <p><strong className="text-ink">You gave it examples.</strong> You didn't write rules like "plantain is yellow". You showed it photos with the right answer attached. That's the core of machine learning: a computer learns from examples, not instructions.</p>
          <p><strong className="text-ink">It found patterns.</strong> During training, the model looked for what makes your class 1 photos different from your class 2 photos: colours, shapes, edges. It started from a model already trained on millions of photos, which is why 30 of yours were enough.</p>
          <p><strong className="text-ink">It made predictions, and sometimes got them wrong.</strong> When you showed it something new, it guessed which class looked most similar. A messy background, poor light, or anything it never saw in training can fool it. Real AI fails the same way, which is why the data you train it on matters so much.</p>
        </div>
      </section>

      <Card className="mt-10 p-6">
        <div className="flex items-center gap-2"><Share2 className="h-5 w-5 text-brand-600" aria-hidden /><h2 className="text-xl font-bold">Show us what you built</h2></div>
        <p className="mt-2 text-ink-soft">Post a screenshot or short clip of your model working, tag <b className="text-ink">{HANDLE}</b>, and tell us what you taught it.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {share.map((s) => (
            <AButton key={s.name} href={s.href} target="_blank" rel="noopener" variant="secondary" size="md">
              Share on {s.name}
            </AButton>
          ))}
        </div>
      </Card>

      <div className="mt-10 overflow-hidden rounded-[28px] bg-brand-700 p-8 text-white sm:p-10">
        <h2 className="text-3xl font-bold">That took 10 minutes.</h2>
        <p className="mt-3 text-lg text-white/85">
          In 12 weeks you'll build and deploy an AI tool that solves a real Nigerian problem, with nothing installed.{" "}
          <b className="text-white">{config?.places ?? 40} places, free.</b>
          {config?.applications_open && config.applications_close && ` Applications close ${config.applications_close}.`}
        </p>
        <LinkButton to={config?.applications_open ? "/apply" : "/#waitlist"} variant="sun" size="lg" className="mt-6">
          {config?.applications_open ? "Apply now" : "Join the waitlist"} <ArrowRight className="h-4 w-4" aria-hidden />
        </LinkButton>
      </div>
    </div>
  );
}
