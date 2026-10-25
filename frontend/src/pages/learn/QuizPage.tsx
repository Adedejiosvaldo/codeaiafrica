import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, PartyPopper, X } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import type { Quiz } from "../../lib/types";
import { useApi } from "../../lib/useApi";
import { Button, Card, ErrorState, LinkButton, Logo, PageLoader, ProgressRing, cx } from "../../components/ui";

type Result = { score: number; out_of: number; pre_score: number | null };

export default function QuizPage() {
  const { token = "", phase = "pre" } = useParams();
  const { data, error, loading } = useApi<Quiz>(`/learner/${token}/quiz/${phase}`);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [confidence, setConfidence] = useState<(number | null)[]>([null, null, null]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const back = `/learn/${token}`;

  const frame = (body: ReactNode) => (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <Link to={back} className="flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
            <X className="h-4 w-4" aria-hidden /> Close
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">{body}</main>
    </div>
  );

  if (loading) return frame(<PageLoader />);
  if (error || !data) return frame(<ErrorState message={error?.message ?? "Something went wrong."} action={<LinkButton to={back} variant="secondary">Back to your dashboard</LinkButton>} />);

  if (result || data.done) {
    const score = result?.score ?? data.score ?? 0;
    return frame(
      <Card className="animate-rise p-8 text-center sm:p-10">
        <PartyPopper className="mx-auto h-10 w-10 text-sun-500" aria-hidden />
        <h1 className="mt-4 text-3xl font-bold">{result ? "Quiz done!" : "You've already taken this quiz"}</h1>
        <div className="mt-6 grid place-items-center">
          <ProgressRing value={score} max={100} size={150} stroke={12}>
            <p className="font-display text-4xl font-bold">{score}<span className="text-xl text-ink-faint">%</span></p>
          </ProgressRing>
        </div>
        <p className="mx-auto mt-6 max-w-md text-ink-soft">
          {phase === "pre"
            ? "Don't worry about the score: this is your starting point. You'll take the same quiz in week 12 and see how far you've come."
            : result?.pre_score != null
              ? `In week 1 you scored ${result.pre_score}%. That's ${score - result.pre_score >= 0 ? "+" : ""}${score - result.pre_score} points. Look how far you've come.`
              : "Thanks for taking the final quiz."}
        </p>
        <LinkButton to={back} size="lg" className="mt-8">Back to your dashboard</LinkButton>
      </Card>,
    );
  }

  const total = data.questions.length;
  const onConfidence = index === total;
  const q = data.questions[index];
  const chosen = answers[index] ?? null;
  const progress = ((index + (onConfidence ? 1 : 0)) / (total + 1)) * 100;

  async function submit() {
    setBusy(true);
    setSubmitError("");
    try {
      setResult(await api.post<Result>(`/learner/${token}/quiz/${phase}`, { answers, confidence }));
    } catch (e) {
      setSubmitError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return frame(
    <>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{phase === "pre" ? "Week 1 knowledge check" : "Final knowledge check"}</span>
        <span className="text-ink-faint">{onConfidence ? "Last step" : `Question ${index + 1} of ${total}`}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-line">
        <div className="h-2 rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {!onConfidence ? (
        <Card key={q.id} className="animate-rise mt-6 p-6 sm:p-8">
          <h1 className="text-2xl font-bold leading-snug">{q.text}</h1>
          <div className="mt-6 space-y-2.5" role="radiogroup">
            {q.options.map((opt, i) => (
              <button key={opt} role="radio" aria-checked={chosen === i}
                onClick={() => setAnswers((a) => { const n = [...a]; n[index] = i; return n; })}
                className={cx("flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-[16px] font-medium transition-all",
                  chosen === i ? "border-brand-500 bg-brand-50/70 ring-4 ring-brand-500/10" : "border-line-strong bg-card hover:border-ink-faint")}>
                <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold",
                  chosen === i ? "bg-brand-600 text-white" : "bg-paper text-ink-soft")}>{"ABC"[i]}</span>
                <span className={cx(/[()[\]_.]/.test(opt) && opt.length < 20 && "font-mono")}>{opt}</span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink-faint">Not sure? Pick your best guess. There's no penalty.</p>
        </Card>
      ) : (
        <Card className="animate-rise mt-6 p-6 sm:p-8">
          <h1 className="text-2xl font-bold">How confident do you feel?</h1>
          <p className="mt-1 text-ink-soft">1 means not at all, 5 means very confident.</p>
          <div className="mt-6 space-y-6">
            {data.confidence.map((statement, i) => (
              <fieldset key={statement}>
                <legend className="font-semibold">"{statement}"</legend>
                <div className="mt-2.5 grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-pressed={confidence[i] === n}
                      onClick={() => setConfidence((c) => { const x = [...c]; x[i] = n; return x; })}
                      className={cx("h-12 rounded-xl border text-lg font-bold transition-all",
                        confidence[i] === n ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-card hover:border-ink-faint")}>
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {submitError && <p className="mt-5 rounded-xl bg-clay-50 px-4 py-3 text-sm font-medium text-clay-700" role="alert">{submitError}</p>}
        </Card>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Button>
        {!onConfidence ? (
          <Button size="lg" onClick={() => setIndex((i) => i + 1)} disabled={chosen === null}>
            Next <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button size="lg" onClick={submit} loading={busy} disabled={confidence.some((c) => c === null)}>
            <Check className="h-4 w-4" aria-hidden /> Finish
          </Button>
        )}
      </div>
    </>,
  );
}
