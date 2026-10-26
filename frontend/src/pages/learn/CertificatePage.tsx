import { Award, Lock, Printer } from "lucide-react";
import { useLearner } from "../../components/LearnerLayout";
import { Button, Card, ErrorState, LinkButton, Logo, PageLoader } from "../../components/ui";
import { useApi } from "../../lib/useApi";

type Cert = {
  name: string; cohort: string; labs_done: number; labs_required: number; available: boolean; reason?: string;
  code?: string; issued_at?: string; capstone?: string | null; verify_url?: string;
};

export default function CertificatePage() {
  const { token } = useLearner();
  const { data, error } = useApi<Cert>(`/learner/${token}/certificate`);
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;

  if (!data.available) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sun-100 text-[#8a5d00]"><Lock className="h-6 w-6" aria-hidden /></span>
        <h1 className="mt-4 text-3xl font-bold">Your certificate</h1>
        <p className="mt-2 text-lg text-ink-soft">{data.reason}</p>
        <p className="mt-1 text-sm text-ink-faint">{data.labs_done} of {data.labs_required} labs done</p>
        <LinkButton to={`/learn/${token}/path`} variant="secondary" className="mt-6">See your learning path</LinkButton>
      </div>
    );
  }

  const issued = data.issued_at ? new Date(data.issued_at.endsWith("Z") || data.issued_at.includes("+") ? data.issued_at : data.issued_at + "Z")
    .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-[30px] font-bold sm:text-4xl">Your certificate</h1>
          <p className="text-ink-soft">Print it, or save it as a PDF from the print window. Anyone can check it's real with the code.</p>
        </div>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Print or save as PDF</Button>
      </div>

      <Card className="relative mx-auto aspect-[1.414] w-full max-w-4xl overflow-hidden p-0 print:max-w-none print:rounded-none print:shadow-none">
        <div className="absolute inset-3 rounded-xl border-2 border-brand-700/80 sm:inset-5" aria-hidden />
        <div className="absolute inset-[18px] rounded-lg border border-sun-500/60 sm:inset-[26px]" aria-hidden />
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sun-300/20 blur-3xl" />
        <div className="relative flex h-full flex-col items-center justify-center px-8 text-center sm:px-16">
          <Logo className="scale-90 sm:scale-110" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-ink-faint sm:mt-6 sm:text-xs">Certificate of completion</p>
          <p className="mt-2 text-xs text-ink-soft sm:mt-5 sm:text-base">This certifies that</p>
          <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-brand-900 sm:mt-2 sm:text-5xl">{data.name}</p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-ink-soft sm:mt-4 sm:text-base">
            completed the Akada Labs 12-week practical AI course ({data.cohort}), finishing {data.labs_done} hands-on labs
            {data.capstone ? <> and building <b className="text-ink">{data.capstone}</b></> : null}.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sun-500 sm:mt-8"><Award className="h-5 w-5 sm:h-8 sm:w-8" aria-hidden /></div>
          <div className="mt-3 grid w-full max-w-lg grid-cols-2 gap-4 text-[10px] text-ink-soft sm:mt-6 sm:text-sm">
            <div><p className="font-semibold text-ink">{issued}</p><p>Date issued</p></div>
            <div><p className="font-mono font-semibold text-ink">{data.code}</p><p>Certificate code</p></div>
          </div>
          <p className="mt-3 text-[9px] text-ink-faint sm:mt-6 sm:text-xs">Check it at {data.verify_url}</p>
        </div>
      </Card>
    </div>
  );
}
