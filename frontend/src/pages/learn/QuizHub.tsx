import { ArrowRight, ClipboardList, Lock } from "lucide-react";
import { useLearner } from "../../components/LearnerLayout";
import { Badge, Card, LinkButton } from "../../components/ui";

export default function QuizHub() {
  const { data, token } = useLearner();
  const { pre, post } = data.quiz;
  const labels = ["I can explain what AI is", "I can write Python to analyse data", "I could build a small AI tool"];
  return (
    <div>
      <h1 className="text-[30px] font-bold sm:text-4xl">Knowledge check</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">The same 20 questions in week 1 and week 12, so you can see how far you've come. About 10 minutes each.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {([["pre", "Week 1", "Your starting point. Don't worry about the score."], ["post", "Week 12", "See how much you've learned."]] as const).map(([phase, title, note]) => {
          const s = data.quiz[phase];
          return (
            <Card key={phase} className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><ClipboardList className="h-5 w-5" aria-hidden /></span>
                <Badge tone={s.done ? "brand" : s.open ? "sun" : "neutral"}>{s.done ? "Done" : s.open ? "Ready" : "Opens in week 12"}</Badge>
              </div>
              <h2 className="mt-4 text-xl font-bold">{title} quiz</h2>
              <p className="text-ink-soft">{note}</p>
              <div className="mt-auto pt-6">
                {s.done ? (
                  <p className="font-display text-5xl font-bold">{s.score}<span className="text-2xl text-ink-faint">%</span></p>
                ) : s.open ? (
                  <LinkButton to={`/learn/${token}/quiz/${phase}`} size="lg">Start the quiz <ArrowRight className="h-4 w-4" aria-hidden /></LinkButton>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-ink-faint"><Lock className="h-4 w-4" aria-hidden /> Not open yet</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {pre.done && (
        <Card className="mt-4 p-6">
          <h2 className="text-lg font-bold">Your confidence (1–5)</h2>
          <ul className="mt-4 space-y-4">
            {labels.map((l, i) => {
              const before = pre.confidence?.[i] ?? 0;
              const after = post.confidence?.[i] ?? null;
              return (
                <li key={l}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{l}</span>
                    <span className="tabular-nums text-ink-soft">{before}{after !== null && <> <ArrowRight className="inline h-3 w-3" aria-label="to" /> <b className="text-ink">{after}</b></>}</span></div>
                  <div className="relative mt-2 h-2 rounded-full bg-line">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-brand-200" style={{ width: `${(before / 5) * 100}%` }} />
                    {after !== null && <div className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${(after / 5) * 100}%` }} />}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
