import type { ReactNode } from "react";

/** Renders the small Markdown subset used in lab steps: paragraphs, **bold**, `code`, ```code blocks``` and "- " lists. */
export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const parts = text.split(/```(?:python)?\n?([\s\S]*?)```/g);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      blocks.push(
        <pre key={i} className="overflow-x-auto rounded-xl bg-[#0d1f16] px-4 py-3.5 font-mono text-[13.5px] leading-relaxed text-[#e6efe9]">
          <code>{part.replace(/\n$/, "")}</code>
        </pre>,
      );
      return;
    }
    part.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).forEach((para, j) => {
      const lines = para.split("\n");
      if (lines.every((l) => l.trim().startsWith("- "))) {
        blocks.push(
          <ul key={`${i}-${j}`} className="space-y-1.5 pl-1">
            {lines.map((l, k) => (
              <li key={k} className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                <span>{inline(l.trim().slice(2))}</span></li>
            ))}
          </ul>,
        );
      } else {
        blocks.push(<p key={`${i}-${j}`}>{inline(lines.join(" "))}</p>);
      }
    });
  });
  return <div className={`space-y-4 leading-relaxed ${className}`}>{blocks}</div>;
}

export function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((t, i) => {
    if (t.startsWith("**")) return <strong key={i} className="font-semibold text-ink">{t.slice(2, -2)}</strong>;
    if (t.startsWith("`")) return <code key={i} className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.88em] text-ink">{t.slice(1, -1)}</code>;
    return t;
  });
}
