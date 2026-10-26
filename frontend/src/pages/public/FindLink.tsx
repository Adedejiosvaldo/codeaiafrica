import { useState } from "react";
import type { FormEvent } from "react";
import { MailCheck, Search } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { Button, Card, Field, TextInput } from "../../components/ui";

export default function FindLink() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "busy" | "done" | "error"; message?: string }>({ status: "idle" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "busy" });
    try {
      const r = await api.post<{ message: string }>("/find-my-link", { email });
      setState({ status: "done", message: r.message });
    } catch (err) {
      setState({ status: "error", message: (err as ApiError).errors?.email ?? (err as ApiError).message });
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-10 sm:px-6">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Search className="h-6 w-6" aria-hidden /></span>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Find my link or application</h1>
      <p className="mt-2 text-lg text-ink-soft">
        Lost your learner dashboard link, or want to know where your application stands? Enter the email you applied with
        and we'll email you.
      </p>
      <Card className="mt-6 p-5 sm:p-6">
        {state.status === "done" ? (
          <div className="flex gap-3">
            <MailCheck className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" aria-hidden />
            <p className="text-ink-soft">{state.message}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Email" htmlFor="find-email" error={state.status === "error" ? state.message : undefined}>
              <TextInput id="find-email" type="email" autoComplete="email" value={email} required
                onChange={(e) => { setEmail(e.target.value); if (state.status === "error") setState({ status: "idle" }); }}
                invalid={state.status === "error"} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={state.status === "busy"} disabled={!email.includes("@")}>Email me</Button>
          </form>
        )}
      </Card>
      <p className="mt-4 text-sm text-ink-faint">For your safety we never show links on this page. They only go to the email on your application.</p>
    </div>
  );
}
