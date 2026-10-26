import { Download, ExternalLink, Rocket, Users } from "lucide-react";
import { PageHeader } from "../../components/AdminLayout";
import { AButton, Badge, Card, EmptyState, ErrorState, PageLoader } from "../../components/ui";
import { formatDate } from "../../lib/labels";
import { useApi } from "../../lib/useApi";

type Data = {
  registrations: { id: number; name: string; email: string; organisation: string; created_at: string }[];
  capstones: { learner: string; title: string; brief: string; public: boolean }[];
};

export default function DemoDayAdmin() {
  const { data, error } = useApi<Data>("/admin/demo-day");
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;
  return (
    <>
      <PageHeader title="Demo day" description="Who's coming, and what learners are building."
        actions={<>
          <AButton href="/demo-day" target="_blank" rel="noopener" variant="secondary"><ExternalLink className="h-4 w-4" aria-hidden /> Public page</AButton>
          <AButton href="/api/admin/export/demo-day.csv" variant="secondary"><Download className="h-4 w-4" aria-hidden /> Export guests</AButton>
        </>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <h2 className="flex items-center gap-2 px-5 pt-5 text-lg font-bold sm:px-6"><Users className="h-5 w-5 text-brand-600" aria-hidden /> Registered guests <span className="text-ink-faint">({data.registrations.length})</span></h2>
          {data.registrations.length === 0 ? <EmptyState icon={<Users className="h-6 w-6" />} title="No one yet">Share the public demo day page.</EmptyState> : (
            <ul className="mt-3 max-h-[520px] divide-y divide-line overflow-y-auto overscroll-contain">
              {data.registrations.map((r) => (
                <li key={r.id} className="px-5 py-3 sm:px-6">
                  <p className="font-medium">{r.name}{r.organisation && <span className="font-normal text-ink-soft"> · {r.organisation}</span>}</p>
                  <p className="text-sm text-ink-faint">{r.email} · {formatDate(r.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="overflow-hidden">
          <h2 className="flex items-center gap-2 px-5 pt-5 text-lg font-bold sm:px-6"><Rocket className="h-5 w-5 text-sun-500" aria-hidden /> Capstones <span className="text-ink-faint">({data.capstones.length})</span></h2>
          {data.capstones.length === 0 ? <EmptyState icon={<Rocket className="h-6 w-6" />} title="None chosen yet">Learners pick one in week 9.</EmptyState> : (
            <ul className="mt-3 divide-y divide-line">
              {data.capstones.map((c) => (
                <li key={c.learner + c.title} className="flex items-start justify-between gap-3 px-5 py-3 sm:px-6">
                  <div><p className="font-medium">{c.title}</p><p className="text-sm text-ink-soft">{c.learner} · {c.brief}</p></div>
                  <Badge tone={c.public ? "brand" : "neutral"}>{c.public ? "In showcase" : "Private"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
