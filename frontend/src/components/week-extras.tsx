import { useState } from "react";
import type { FormEvent } from "react";
import { Lightbulb, MessageSquareText, Rocket } from "lucide-react";
import { ApiError, api } from "../lib/api";
import { formatDate } from "../lib/labels";
import type { LearnerDashboard, LearnerWeek } from "../lib/types";
import { Button, Card, ChoiceGroup, Field, TextArea, TextInput, Toggle, useToast } from "./ui";

const PROMPTS: Record<number, string> = {
  1: "What did your model get wrong, and why do you think it did?",
  3: "What does your price chart show? What surprised you?",
  4: "Which feature mattered most to your model? Does that match what you know about Lagos rents?",
  5: "Who gets hurt when a model ignores Pidgin speakers? What would you do about it?",
  6: "Look at the photos your model got wrong. Why do you think it missed them?",
  8: "Did meaning-based search or keyword search do better on your Pidgin question? Why?",
  9: "Describe a question your RAG bot got wrong. Was retrieval or generation to blame?",
  10: "When could an agent that calls tools be risky? What guardrails would you add?",
};

/** A short written reflection for the week; a TA replies with feedback. */
export function ReflectionCard({ week, token, onSaved }: { week: LearnerWeek; token: string; onSaved: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(week.reflection?.text ?? "");
  const [busy, setBusy] = useState(false);
  const prompt = PROMPTS[week.week] ?? "What did you learn this week, and what was hardest?";
  const changed = text.trim() !== (week.reflection?.text ?? "");

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.put<{ message: string }>(`/learner/${token}/reflections/${week.week}`, { text });
      toast(r.message);
      onSaved();
    } catch (err) {
      toast((err as ApiError).errors.text ?? (err as ApiError).message, "error");
    } finally { setBusy(false); }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-brand-600" aria-hidden /><h2 className="text-lg font-bold">Reflection</h2></div>
      <p className="mt-1 text-ink-soft">{prompt}</p>
      <form onSubmit={save} className="mt-4 space-y-3">
        <TextArea rows={4} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} aria-label="Your reflection"
          placeholder="A few sentences in your own words. There are no wrong answers." />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-faint">{week.reflection ? "Saved. You can update it any time." : "A teaching assistant reads every reflection."}</span>
          <Button type="submit" size="sm" variant={changed ? "primary" : "secondary"} loading={busy} disabled={!changed || text.trim().length < 20}>
            {week.reflection ? "Update" : "Save reflection"}
          </Button>
        </div>
      </form>
      {week.reflection?.feedback && (
        <div className="mt-4 rounded-xl bg-brand-50/70 p-4">
          <p className="text-sm font-semibold text-brand-700">Feedback from {week.reflection.feedback_by}</p>
          <p className="mt-1 whitespace-pre-line text-[15px]">{week.reflection.feedback}</p>
          <p className="mt-1 text-xs text-ink-faint">{formatDate(week.reflection.feedback_at)}</p>
        </div>
      )}
    </Card>
  );
}

const BRIEFS = [
  { value: "pidgin-sentiment", label: "Pidgin sentiment checker", hint: "Label customer messages in Pidgin or English" },
  { value: "market-price-agent", label: "Market price agent", hint: "Answer price questions by calling a tool" },
  { value: "ask-the-law", label: "Ask-the-law bot", hint: "Answer questions about a document, with citations" },
  { value: "bank-alert-parser", label: "Bank alert parser", hint: "Turn SMS alerts into a spending table" },
  { value: "own", label: "My own idea", hint: "Something you care about" },
];

/** Week 9: choose a capstone brief (or your own idea). */
export function CapstoneCard({ data, token, onSaved }: { data: LearnerDashboard; token: string; onSaved: () => void }) {
  const toast = useToast();
  const c = data.capstone;
  const [form, setForm] = useState({ brief: c?.brief ?? "", title: c?.title ?? "", description: c?.description ?? "", public: c?.public ?? true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/learner/${token}/capstone`, form);
      toast("Capstone saved");
      setErrors({});
      onSaved();
    } catch (err) {
      setErrors((err as ApiError).errors);
      toast((err as ApiError).message, "error");
    } finally { setBusy(false); }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2"><Rocket className="h-5 w-5 text-sun-500" aria-hidden /><h2 className="text-lg font-bold">Choose your capstone</h2></div>
      <p className="mt-1 text-ink-soft">The AI tool you'll build, deploy in week 11 and demo in week 12. You can change it until then.</p>
      <form onSubmit={save} className="mt-5 space-y-5">
        <ChoiceGroup name="brief" columns={2} value={form.brief} options={BRIEFS} invalid={!!errors.brief}
          onChange={(v) => setForm({ ...form, brief: v, title: form.title || (v === "own" ? "" : BRIEFS.find((b) => b.value === v)!.label) })} />
        <Field label="Project name" htmlFor="cap-title" error={errors.title}>
          <TextInput id="cap-title" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kano rice watch" />
        </Field>
        <Field label="What will it do, and for whom?" htmlFor="cap-desc" error={errors.description}>
          <TextArea id="cap-desc" rows={3} maxLength={1500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Helps traders in Kano check how rice prices have changed, by asking in plain English or Pidgin." />
        </Field>
        <Toggle label="Show it in the public showcase" hint="Your first name and last initial, the project name and description, and your Space link once it's live."
          checked={form.public} onChange={(v) => setForm({ ...form, public: v })} />
        <div className="flex items-center gap-3">
          <Button type="submit" loading={busy} disabled={!form.brief}>{c ? "Update capstone" : "Save capstone"}</Button>
          {c && <span className="flex items-center gap-1.5 text-sm text-ink-soft"><Lightbulb className="h-4 w-4 text-sun-500" aria-hidden /> Saved: {c.title}</span>}
        </div>
      </form>
    </Card>
  );
}
