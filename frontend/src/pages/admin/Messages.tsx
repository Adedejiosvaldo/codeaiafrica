import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AlertCircle, Megaphone, Send, Trash2, UserPlus, Users } from "lucide-react";
import { PageHeader, useAdmin } from "../../components/AdminLayout";
import { Button, Card, ErrorState, Field, PageLoader, PRESS, TextArea, TextInput, Toggle, cx, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { formatDate } from "../../lib/labels";
import { useApi } from "../../lib/useApi";

type Status = { email_enabled: boolean; pending_decisions: number; learners: number; waitlist: number };
type Post = { id: number; title: string; body: string; author: string; created_at: string };

export default function Messages() {
  const { data: status, error, reload } = useApi<Status>("/admin/messages/status");
  const posts = useApi<Post[]>("/admin/announcements");
  const isAdmin = useAdmin().role === "admin";
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [post, setPost] = useState({ title: "", body: "", email: false });

  async function act(key: string, path: string, body: unknown = {}, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(key);
    try {
      const r = await api.post<{ message: string }>(path, body);
      toast(r.message);
      reload();
      posts.reload();
      return true;
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally { setBusy(null); }
  }

  async function publish(e: FormEvent) {
    e.preventDefault();
    if (await act("post", "/admin/announcements", post)) setPost({ title: "", body: "", email: false });
  }

  if (error) return <ErrorState message={error.message} />;
  if (!status) return <PageLoader />;
  const noEmail = !status.email_enabled;

  return (
    <>
      <PageHeader title="Messages" description="Email applicants, learners and the waitlist, and post announcements to learner dashboards." />
      {noEmail && (
        <div className="mb-5 flex gap-3 rounded-2xl bg-sun-100 px-4 py-3.5 text-[15px] text-[#6b4a00]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>Email isn't set up yet. Add the <code className="font-mono text-sm">SMTP_*</code> settings to the server's <code className="font-mono text-sm">.env</code> (see the deploy guide). Until then, copy learner links from the Learners page.</p>
        </div>
      )}
      {!isAdmin && <p className="mb-5 text-sm text-ink-soft">Only an admin can send emails or post announcements.</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Action icon={<Send className="h-5 w-5" />} title="Decision emails"
          body={`Tells applicants their result: accepted (with their learner link), waitlist, or not accepted. Each person is only emailed once per decision.`}
          count={`${status.pending_decisions} waiting to be sent`}
          button={<Button disabled={noEmail || !isAdmin || !status.pending_decisions} loading={busy === "dec"}
            onClick={() => act("dec", "/admin/messages/decisions", {}, `Email ${status.pending_decisions} applicants their decision?`)}>Send decisions</Button>} />
        <Action icon={<Users className="h-5 w-5" />} title="Learner links"
          body="Re-sends every learner their private dashboard link, for example before week 1."
          count={`${status.learners} learners`}
          button={<Button variant="secondary" disabled={noEmail || !isAdmin || !status.learners} loading={busy === "links"}
            onClick={() => act("links", "/admin/messages/learner-links", {}, `Email all ${status.learners} learners their link?`)}>Send links</Button>} />
        <Card className="flex flex-col p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserPlus className="h-5 w-5" aria-hidden /></span>
          <h2 className="mt-3 text-lg font-bold">Applications are open</h2>
          <p className="mt-1 text-sm text-ink-soft">Tells everyone on the waitlist that applications are open, with the apply link.</p>
          <TextArea rows={2} className="mt-3 text-sm" placeholder="Optional extra line, e.g. a live Q&A date" value={extra} onChange={(e) => setExtra(e.target.value)} aria-label="Extra line" />
          <p className="mt-2 text-xs text-ink-faint">{status.waitlist} people on the waitlist</p>
          <Button className="mt-3 self-start" variant="secondary" disabled={noEmail || !isAdmin || !status.waitlist} loading={busy === "wl"}
            onClick={() => act("wl", "/admin/messages/waitlist", { extra }, `Email all ${status.waitlist} people on the waitlist?`)}>Notify waitlist</Button>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-brand-600" aria-hidden /><h2 className="text-lg font-bold">New announcement</h2></div>
          <p className="mt-1 text-sm text-ink-soft">Shows at the top of every learner's dashboard.</p>
          <form onSubmit={publish} className="mt-4 space-y-4">
            <Field label="Title" htmlFor="ann-title"><TextInput id="ann-title" maxLength={160} value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} /></Field>
            <Field label="Message" htmlFor="ann-body"><TextArea id="ann-body" rows={4} value={post.body} onChange={(e) => setPost({ ...post, body: e.target.value })} /></Field>
            <Toggle label="Also email it to learners" hint={noEmail ? "Needs email to be set up" : undefined} checked={post.email} onChange={(v) => setPost({ ...post, email: v && !noEmail })} />
            <Button type="submit" loading={busy === "post"} disabled={!isAdmin || post.title.trim().length < 2 || post.body.trim().length < 2}>Post announcement</Button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <h2 className="px-5 pt-5 text-lg font-bold sm:px-6">Posted</h2>
          {!posts.data?.length ? <p className="px-6 pb-6 pt-2 text-sm text-ink-faint">No announcements yet.</p> : (
            <ul className="mt-3 divide-y divide-line">
              {posts.data.map((p) => (
                <li key={p.id} className="flex gap-3 px-5 py-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.title}</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{p.body}</p>
                    <p className="mt-1.5 text-xs text-ink-faint">{p.author} · {formatDate(p.created_at, true)}</p>
                  </div>
                  {isAdmin && (
                    <button aria-label={`Delete ${p.title}`} onClick={async () => {
                      if (!confirm("Delete this announcement?")) return;
                      await api.del(`/admin/announcements/${p.id}`).catch(() => {}); posts.reload();
                    }} className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint transition-[background-color,color,scale] duration-150 hover:bg-clay-50 hover:text-clay-700", PRESS)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Action({ icon, title, body, count, button }: { icon: ReactNode; title: string; body: string; count: string; button: ReactNode }) {
  return (
    <Card className="flex flex-col p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <h2 className="mt-3 text-lg font-bold">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-ink-soft">{body}</p>
      <p className="mt-3 text-xs text-ink-faint">{count}</p>
      <div className="mt-3">{button}</div>
    </Card>
  );
}
