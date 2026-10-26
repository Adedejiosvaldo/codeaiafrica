import { useEffect, useState } from "react";
import { Check, Users } from "lucide-react";
import { PageHeader } from "../../components/AdminLayout";
import { Button, Card, EmptyState, ErrorState, PageLoader, cx, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { useApi } from "../../lib/useApi";

type Row = { learner_id: number; name: string; present: boolean };

export default function Attendance() {
  const [week, setWeek] = useState(1);
  const { data, error } = useApi<Row[]>(`/admin/attendance/${week}`);
  const [present, setPresent] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => { if (data) setPresent(new Set(data.filter((r) => r.present).map((r) => r.learner_id))); }, [data]);
  if (error) return <ErrorState message={error.message} />;

  const toggle = (id: number) => setPresent((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const dirty = data && data.some((r) => r.present !== present.has(r.learner_id));

  async function save() {
    setBusy(true);
    try { toast((await api.put<{ message: string }>(`/admin/attendance/${week}`, { present: [...present] })).message); }
    catch (e) { toast((e as ApiError).message, "error"); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Attendance" description="Tick who joined each Saturday session." />
      <div className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
          <button key={w} onClick={() => setWeek(w)} className={cx("h-9 min-w-9 shrink-0 rounded-full px-3 text-sm font-semibold transition-[background-color,color] duration-150",
            week === w ? "bg-ink text-white" : "bg-card text-ink-soft ring-1 ring-line hover:text-ink")}>W{w}</button>
        ))}
      </div>
      {!data ? <PageLoader /> : data.length === 0 ? (
        <Card><EmptyState icon={<Users className="h-6 w-6" />} title="No learners yet" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="text-sm text-ink-soft"><b className="text-ink">{present.size}</b> of {data.length} present in week {week}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPresent(new Set(present.size === data.length ? [] : data.map((r) => r.learner_id)))}>
                {present.size === data.length ? "Clear all" : "Mark all"}
              </Button>
              <Button size="sm" loading={busy} disabled={!dirty} onClick={save}>Save</Button>
            </div>
          </div>
          <ul className="grid divide-line sm:grid-cols-2 sm:divide-x-0 lg:grid-cols-3">
            {data.map((r) => {
              const on = present.has(r.learner_id);
              return (
                <li key={r.learner_id} className="border-b border-line">
                  <button role="checkbox" aria-checked={on} onClick={() => toggle(r.learner_id)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-[background-color] duration-150 hover:bg-paper">
                    <span className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-[background-color,border-color] duration-150",
                      on ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")}>{on && <Check className="h-4 w-4" aria-hidden />}</span>
                    <span className="truncate font-medium">{r.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
