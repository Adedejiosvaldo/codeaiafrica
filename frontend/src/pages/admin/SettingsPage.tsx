import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { PageHeader, useAdmin } from "../../components/AdminLayout";
import { Badge, Button, Card, ErrorState, Field, PageLoader, PRESS, TextInput, Toggle, cx, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { formatDate } from "../../lib/labels";
import type { SettingsData } from "../../lib/types";
import { useApi } from "../../lib/useApi";

export default function SettingsPage() {
  const me = useAdmin();
  const isAdmin = me.role === "admin";
  const { data, error } = useApi<SettingsData>("/admin/settings");
  const [form, setForm] = useState<SettingsData | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => { if (data) setForm(data); }, [data]);

  if (error) return <ErrorState message={error.message} />;
  if (!form) return <PageLoader />;
  const set = <K extends keyof SettingsData>(k: K, v: SettingsData[K]) => setForm({ ...form, [k]: v });

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setForm(await api.put<SettingsData>("/admin/settings", form));
      toast("Settings saved");
    } catch (err) {
      toast((err as ApiError).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const num = (k: "cap" | "waitlist_size" | "labs_required") => (
    <TextInput id={k} type="number" inputMode="numeric" min={k === "waitlist_size" ? 0 : 1} value={form[k]}
      onChange={(e) => set(k, Number(e.target.value))} />
  );

  return (
    <>
      <PageHeader title="Settings" description="Programme settings, your password, and who's on the team." />
      <form onSubmit={save}>
        <Card className="divide-y divide-line">
          <section className="space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Applications</h2>
            <Toggle label="Applications are open" hint="When off, the site shows the waitlist instead of the form."
              checked={form.applications_open} onChange={(v) => set("applications_open", v)} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Cohort name" htmlFor="cohort_name">
                <TextInput id="cohort_name" value={form.cohort_name} onChange={(e) => set("cohort_name", e.target.value)} />
              </Field>
              <Field label="Applications close" htmlFor="close" hint="Shown on the site, e.g. 31 January 2027">
                <TextInput id="close" value={form.applications_close} onChange={(e) => set("applications_close", e.target.value)} />
              </Field>
            </div>
          </section>
          <section className="space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Selection and completion</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Places" htmlFor="cap">{num("cap")}</Field>
              <Field label="Waitlist size" htmlFor="waitlist_size">{num("waitlist_size")}</Field>
              <Field label="Labs for a certificate" htmlFor="labs_required">{num("labs_required")}</Field>
            </div>
          </section>
          <section className="space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Course</h2>
            <Toggle label="Final quiz is open" hint="Turn on in week 12 so learners can take the end-of-course quiz."
              checked={form.post_quiz_open} onChange={(v) => set("post_quiz_open", v)} />
            <Toggle label="Certificates are available" hint="Turn on at demo day. Learners who've done enough labs can then print their certificate."
              checked={form.certificates_open} onChange={(v) => set("certificates_open", v)} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First live session (week 1)" htmlFor="start_date" hint="Learners see the current week and next session from this.">
                <TextInput id="start_date" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              </Field>
              <Field label="Live session link" htmlFor="session_link" hint="Zoom, Google Meet or similar. Learners see a Join button.">
                <TextInput id="session_link" type="url" placeholder="https://" value={form.session_link} onChange={(e) => set("session_link", e.target.value)} />
              </Field>
              <Field label="Live session time" htmlFor="session_time" hint="Shown as written, e.g. 10:00 WAT">
                <TextInput id="session_time" value={form.session_time} onChange={(e) => set("session_time", e.target.value)} />
              </Field>
              <Field label="Privacy contact email" htmlFor="contact_email" hint="Shown on the privacy page for data requests">
                <TextInput id="contact_email" type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
              </Field>
              <Field label="Demo day" htmlFor="demo_day" hint="Shown as written, e.g. 24 April 2027">
                <TextInput id="demo_day" value={form.demo_day} onChange={(e) => set("demo_day", e.target.value)} />
              </Field>
            </div>
          </section>
          <div className="flex justify-end p-5 sm:p-6">
            {isAdmin ? <Button type="submit" loading={busy}>Save settings</Button>
              : <p className="text-sm text-ink-soft">Only an admin can change these settings.</p>}
          </div>
        </Card>
      </form>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PasswordCard />
        <TeamCard isAdmin={isAdmin} myEmail={me.email} />
      </div>
      {isAdmin && <ActivityLog />}
    </>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/password", { current, new: next });
      setCurrent(""); setNext("");
      toast("Password changed");
    } catch (err) {
      toast((err as ApiError).message, "error");
    } finally { setBusy(false); }
  }
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Change your password</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <Field label="Current password" htmlFor="cur"><TextInput id="cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="New password" htmlFor="new" hint="At least 10 characters."><TextInput id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Button type="submit" variant="secondary" loading={busy} disabled={!current || next.length < 10}>Change password</Button>
      </form>
    </Card>
  );
}

function TeamCard({ isAdmin, myEmail }: { isAdmin: boolean; myEmail: string }) {
  const { data, reload } = useApi<{ id: number; email: string; name: string; role: "admin" | "ta"; created_at: string }[]>("/admin/team");
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "ta" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post<{ message: string }>("/admin/team", form);
      toast(r.message);
      setForm({ email: "", name: "", password: "", role: "ta" });
      reload();
    } catch (err) {
      toast((err as ApiError).message, "error");
    } finally { setBusy(false); }
  }
  async function act(fn: () => Promise<{ message: string }>) {
    try { toast((await fn()).message); reload(); } catch (err) { toast((err as ApiError).message, "error"); }
  }
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Team</h2>
      <p className="text-sm text-ink-soft">Admins can do everything. TAs can review and score applications, see learners, mark attendance and give feedback.</p>
      <ul className="mt-3 divide-y divide-line">
        {data?.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0"><span className="block truncate font-medium">{m.name || m.email}</span>
              <span className="block truncate text-sm text-ink-soft">{m.name ? `${m.email} · ` : ""}since {formatDate(m.created_at)}</span></span>
            {isAdmin && m.email !== myEmail ? (
              <span className="flex shrink-0 items-center gap-1">
                <select aria-label={`Role for ${m.email}`} value={m.role}
                  onChange={(e) => act(() => api.patch(`/admin/team/${m.id}`, { role: e.target.value }))}
                  className="h-8 rounded-lg border border-line-strong bg-card px-2 text-sm">
                  <option value="ta">TA</option><option value="admin">Admin</option>
                </select>
                <button aria-label={`Remove ${m.email}`} title="Remove from team"
                  onClick={() => confirm(`Remove ${m.email} from the team?`) && act(() => api.del(`/admin/team/${m.id}`))}
                  className={cx("grid h-8 w-8 place-items-center rounded-full text-ink-faint transition-[background-color,color,scale] duration-150 hover:bg-clay-50 hover:text-clay-700", PRESS)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            ) : <Badge>{m.role === "ta" ? "TA" : "Admin"}{m.email === myEmail ? " (you)" : ""}</Badge>}
          </li>
        ))}
      </ul>
      {isAdmin && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-line pt-4">
          <p className="text-sm font-semibold">Add a team member</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextInput placeholder="Email" aria-label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <TextInput placeholder="Temporary password (10+ characters)" aria-label="Temporary password" type="text" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select aria-label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="h-12 rounded-xl border border-line-strong bg-card px-3 text-[15px]">
              <option value="ta">TA</option><option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" loading={busy} disabled={!form.email || form.password.length < 10}>Add to team</Button>
        </form>
      )}
    </Card>
  );
}

function ActivityLog() {
  const { data } = useApi<{ id: number; who: string; action: string; detail: string; at: string }[]>("/admin/audit");
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="px-5 pt-5 sm:px-6">
        <h2 className="text-lg font-bold">Activity log</h2>
        <p className="text-sm text-ink-soft">Who did what, newest first. Useful for data-protection questions.</p>
      </div>
      <ul className="mt-3 max-h-96 divide-y divide-line overflow-y-auto overscroll-contain">
        {data?.length === 0 && <li className="px-6 py-4 text-sm text-ink-faint">Nothing yet.</li>}
        {data?.map((e) => (
          <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-5 py-2.5 text-sm sm:px-6">
            <span><b className="font-semibold">{e.who}</b> {e.action}{e.detail && <span className="text-ink-soft">: {e.detail}</span>}</span>
            <span className="text-xs text-ink-faint">{formatDate(e.at, true)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
