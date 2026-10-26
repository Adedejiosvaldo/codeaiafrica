import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, SearchX, ShieldCheck } from "lucide-react";
import { useApi } from "../../lib/useApi";
import { Button, Card, Field, PageLoader, TextInput } from "../../components/ui";

type Result = { valid: boolean; name: string; cohort: string; labs_done: number; issued_at: string | null; capstone: string | null };

export default function Verify() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? "");
  const { data, error, loading } = useApi<Result>(code ? `/certificates/${encodeURIComponent(code)}` : null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (input.trim()) navigate(`/verify/${input.trim().toUpperCase()}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-10 sm:px-6">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShieldCheck className="h-6 w-6" aria-hidden /></span>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Check a certificate</h1>
      <p className="mt-2 text-lg text-ink-soft">Enter the code printed on an Akada Labs certificate to confirm it's real.</p>
      <form onSubmit={submit} className="mt-6 flex gap-2">
        <div className="flex-1"><Field label={<span className="sr-only">Certificate code</span>} htmlFor="code">
          <TextInput id="code" placeholder="AKL-1A2B-3C4D" className="font-mono uppercase" value={input} onChange={(e) => setInput(e.target.value)} />
        </Field></div>
        <Button type="submit" size="lg" className="self-end">Check</Button>
      </form>
      {code && (
        <div className="mt-6">
          {loading ? <PageLoader /> : error ? (
            <Card className="flex gap-3 p-5"><SearchX className="h-6 w-6 shrink-0 text-clay-500" aria-hidden /><p className="text-ink-soft">{error.message}</p></Card>
          ) : data && (
            <Card className="p-6">
              <p className="flex items-center gap-2 font-semibold text-brand-700"><BadgeCheck className="h-5 w-5" aria-hidden /> This certificate is real</p>
              <dl className="mt-4 space-y-2 text-[15px]">
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Name</dt><dd className="font-semibold">{data.name}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Course</dt><dd>Akada Labs, {data.cohort}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Labs completed</dt><dd>{data.labs_done} of 12</dd></div>
                {data.capstone && <div className="flex justify-between gap-4"><dt className="text-ink-soft">Capstone</dt><dd className="text-right">{data.capstone}</dd></div>}
                {data.issued_at && <div className="flex justify-between gap-4"><dt className="text-ink-soft">Issued</dt><dd>{new Date(data.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd></div>}
              </dl>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
