import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { PageHeader } from "../../components/AdminLayout";
import { Button, Card, ErrorState, Field, PageLoader, TextInput, Toggle, useToast } from "../../components/ui";
import { ApiError, api } from "../../lib/api";
import { formatDate } from "../../lib/labels";
import type { SettingsData } from "../../lib/types";
import { useApi } from "../../lib/useApi";

export default function SettingsPage() {
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
            <Field label="Demo day" htmlFor="demo_day">
              <TextInput id="demo_day" value={form.demo_day} onChange={(e) => set("demo_day", e.target.value)} />
            </Field>
          </section>
          <div className="flex justify-end p-5 sm:p-6">
            <Button type="submit" loading={busy}>Save settings</Button>
          </div>
        </Card>
      </form>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PasswordCard />
        <TeamCard />
      </div>
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

function TeamCard() {
  const { data, reload } = useApi<{ id: number; email: string; name: string; created_at: string }[]>("/admin/team");
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post<{ message: string }>("/admin/team", form);
      toast(r.message);
      setForm({ email: "", name: "", password: "" });
      reload();
    } catch (err) {
      toast((err as ApiError).message, "error");
    } finally { setBusy(false); }
  }
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Team</h2>
      <ul className="mt-3 divide-y divide-line">
        {data?.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0"><span className="block truncate font-medium">{m.name || m.email}</span>
              {m.name && <span className="block truncate text-sm text-ink-soft">{m.email}</span>}</span>
            <span className="shrink-0 text-xs text-ink-faint">since {formatDate(m.created_at)}</span>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-4 space-y-3 border-t border-line pt-4">
        <p className="text-sm font-semibold">Add a TA or team member</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextInput placeholder="Email" aria-label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <TextInput placeholder="Temporary password (10+ characters)" aria-label="Temporary password" type="text" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" variant="secondary" loading={busy} disabled={!form.email || form.password.length < 10}>Add to team</Button>
      </form>
    </Card>
  );
}
