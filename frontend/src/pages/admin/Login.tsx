import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { Button, Card, Field, Logo, TextInput } from "../../components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/admin/login", { email, password });
      const next = params.get("next");
      navigate(next && next.startsWith("/admin") ? next : "/admin", { replace: true });
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -bottom-32 -right-32 h-[460px] w-[460px] rounded-full bg-sun-300/20 blur-3xl" />
        <Link to="/"><Logo light /></Link>
        <div className="relative mt-auto max-w-md">
          <p className="font-display text-4xl font-bold leading-tight">Every learner, every lab, in one place.</p>
          <p className="mt-4 text-lg text-white/70">Review applications, run selection, and see who needs a nudge this week.</p>
        </div>
      </div>
      <div className="grid place-items-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <h1 className="mt-8 text-3xl font-bold lg:mt-0">Team sign in</h1>
          <p className="mt-1 text-ink-soft">For Akada Labs staff and TAs.</p>
          <Card className="mt-6 p-6">
            <form onSubmit={submit} className="space-y-5">
              <Field label="Email" htmlFor="email">
                <TextInput id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password" htmlFor="password">
                <TextInput id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              {error && <p className="rounded-xl bg-clay-50 px-3 py-2.5 text-sm font-medium text-clay-700" role="alert">{error}</p>}
              <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
