import type { ReactNode } from "react";
import { usePublicConfig } from "../../components/PublicLayout";

export default function Privacy() {
  const config = usePublicConfig();
  const contact = config?.contact_email;
  const mail = contact ? <a className="font-semibold text-brand-700 underline" href={`mailto:${contact}`}>{contact}</a> : "the contact email we share with applicants";

  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <p className="text-sm font-semibold text-brand-600">Privacy notice</p>
      <h1 className="mt-2 text-4xl font-bold">How we use your information</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Akada Labs runs a free AI course. To run it, we need some information about you. This notice explains what we
        collect, why, and your rights under the Nigeria Data Protection Act 2023 (NDPA).
      </p>

      <div className="mt-10 space-y-9 text-[16.5px] leading-relaxed text-ink-soft">
        <Section title="What we collect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><b className="text-ink">Waitlist:</b> your email address, and your name if you give it.</li>
            <li><b className="text-ink">Application:</b> name, email, WhatsApp number, city and country, confirmation you are 18 or older, what describes you, your device, your availability, coding experience, and the problem you'd like to solve with AI.</li>
            <li><b className="text-ink">If you join the course:</b> the work you submit (completion codes, links, lab progress and code you check), quiz answers, reflections, attendance, and how many AI calls you make in the labs.</li>
          </ul>
          <p>We don't collect payment details, ID documents, or your location.</p>
        </Section>

        <Section title="Why we use it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To choose who joins a cohort, using the scoring rules we publish on our website.</li>
            <li>To contact you about your application and the course, by email and WhatsApp.</li>
            <li>To track your progress, give feedback and issue certificates.</li>
            <li>To report results to funders and partners, only as totals that don't identify anyone.</li>
          </ul>
          <p>We process your information because you agree to it when you apply or join the waitlist. You can withdraw that agreement at any time (see "Your rights").</p>
        </Section>

        <Section title="Who can see it">
          <p>Only the Akada Labs team and teaching assistants, who need it to run the course. We don't sell your information or share it for advertising.</p>
          <p>Some trusted services help us run the course:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><b className="text-ink">Our server provider</b>, which stores the website and database.</li>
            <li><b className="text-ink">AI providers</b> (such as Groq or Google): in the AI labs, the prompts and text you send are passed to them to get a reply. Your name and contact details are not sent. Don't paste personal information into lab prompts.</li>
            <li><b className="text-ink">Our email provider</b>, to send you messages.</li>
          </ul>
          <p>Some of these services are outside Nigeria. Where that happens, we choose providers with appropriate protection for personal data, as the NDPA requires.</p>
        </Section>

        <Section title="How long we keep it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Applications from people who don't join: deleted 12 months after the cohort's selection.</li>
            <li>Learner records: kept for 3 years after the course, so we can confirm certificates. After that, we delete them or keep only anonymous totals.</li>
            <li>Waitlist: until you ask us to remove you, or 2 years after you join it.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p>Under the NDPA you can ask us to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>show you the information we hold about you, and give you a copy;</li>
            <li>correct anything that's wrong;</li>
            <li>delete your information, or stop using it;</li>
            <li>withdraw your consent (this means we can't consider your application or continue your place in the course).</li>
          </ul>
          <p>Contact us at {mail}. We'll reply within 30 days. If you're unhappy with how we handle your information, you can complain to the Nigeria Data Protection Commission.</p>
        </Section>

        <Section title="Keeping it safe">
          <p>The website uses encrypted connections (HTTPS). Team accounts have passwords and limited roles, and we keep a log of who accesses or exports data. Your learner link is private: don't share it, and ask us for a new one if you think someone else has it.</p>
        </Section>

        <p className="border-t border-line pt-6 text-sm">This notice may be updated as the course changes. We'll tell learners about important changes.</p>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
