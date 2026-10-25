import { Download, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "../../components/AdminLayout";
import { AButton, Card, cx, EmptyState, ErrorState, PageLoader, PRESS, useToast } from "../../components/ui";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/labels";
import { useApi } from "../../lib/useApi";

type Entry = { id: number; email: string; name: string; created_at: string };

export default function Waitlist() {
  const { data, error, setData } = useApi<Entry[]>("/admin/waitlist");
  const toast = useToast();
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;

  async function remove(e: Entry) {
    if (!confirm(`Remove ${e.email} from the waitlist?`)) return;
    await api.del(`/admin/waitlist/${e.id}`);
    setData((d) => d?.filter((x) => x.id !== e.id) ?? null);
    toast("Removed");
  }

  return (
    <>
      <PageHeader title="Waitlist" description={`${data.length} people asked to hear when applications open.`}
        actions={<AButton href="/api/admin/export/waitlist.csv" variant="secondary"><Download className="h-4 w-4" aria-hidden /> Export CSV</AButton>} />
      <Card className="overflow-hidden">
        {data.length === 0 ? (
          <EmptyState icon={<UserPlus className="h-6 w-6" />} title="No sign-ups yet">People who join from the home page show up here.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((e) => (
              <li key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 font-semibold uppercase text-brand-700">{(e.name || e.email)[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.email}</p>
                  <p className="text-sm text-ink-soft">{e.name || "No name"} · joined {formatDate(e.created_at)}</p>
                </div>
                <button onClick={() => remove(e)} className={cx("grid h-9 w-9 place-items-center rounded-full text-ink-faint hover:bg-clay-50 hover:text-clay-700 transition-[background-color,color,scale] duration-150 ease-out", PRESS)} aria-label={`Remove ${e.email}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
