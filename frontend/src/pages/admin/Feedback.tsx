import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { PageHeader } from "../../components/AdminLayout";
import { Button, Card, EmptyState, ErrorState, PageLoader, TextArea, cx, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { formatDate } from "../../lib/labels";
import { useApi } from "../../lib/useApi";

type Item = { id: number; learner: string; week: number; week_title: string; text: string; updated_at: string;
  feedback: string; feedback_by: string; feedback_at: string | null };

export default function Feedback() {
  const [pending, setPending] = useState(true);
  const { data, error, reload } = useApi<Item[]>(`/admin/reflections${pending ? "?pending=true" : ""}`);
  if (error) return <ErrorState message={error.message} />;
  return (
    <>
      <PageHeader title="Feedback" description="Learners' weekly reflections. A short, specific reply keeps people going."
        actions={
          <div className="flex gap-1 rounded-full bg-card p-1 ring-1 ring-line">
            {([[true, "Needs a reply"], [false, "All"]] as const).map(([v, l]) => (
              <button key={l} onClick={() => setPending(v)} className={cx("rounded-full px-3.5 py-1.5 text-sm font-semibold transition-[background-color,color] duration-150",
                pending === v ? "bg-ink text-white" : "text-ink-soft")}>{l}</button>
            ))}
          </div>} />
      {!data ? <PageLoader /> : data.length === 0 ? (
        <Card><EmptyState icon={<MessageSquareText className="h-6 w-6" />} title={pending ? "All caught up" : "No reflections yet"}>
          {pending ? "Every reflection has a reply." : "They'll appear here as learners write them."}</EmptyState></Card>
      ) : (
        <div className="space-y-4">{data.map((r) => <ReflectionItem key={r.id} item={r} onDone={reload} />)}</div>
      )}
    </>
  );
}

function ReflectionItem({ item, onDone }: { item: Item; onDone: () => void }) {
  const [text, setText] = useState(item.feedback);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function send() {
    setBusy(true);
    try { toast((await api.patch<{ message: string }>(`/admin/reflections/${item.id}`, { feedback: text })).message); onDone(); }
    catch (e) { toast((e as ApiError).message, "error"); }
    finally { setBusy(false); }
  }
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{item.learner} <span className="font-normal text-ink-soft">· Week {item.week}: {item.week_title}</span></p>
        <span className="text-xs text-ink-faint">{formatDate(item.updated_at, true)}</span>
      </div>
      <p className="mt-3 whitespace-pre-line rounded-xl bg-paper p-4 text-[15px] leading-relaxed">{item.text}</p>
      <div className="mt-3 space-y-2">
        <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your reply: what's good, and one question to push their thinking." aria-label={`Reply to ${item.learner}`} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-faint">{item.feedback_at ? `Replied by ${item.feedback_by}, ${formatDate(item.feedback_at)}` : ""}</span>
          <Button size="sm" loading={busy} disabled={text.trim().length < 2 || text === item.feedback} onClick={send}>{item.feedback ? "Update reply" : "Send reply"}</Button>
        </div>
      </div>
    </Card>
  );
}
