import type { ReactNode } from "react";

export interface ProseSection {
  heading: string;
  /** Plain paragraphs, or a bullet list. */
  paragraphs?: string[];
  bullets?: string[];
}

/**
 * Shell for the text-only pages — privacy, terms, about, contact. Same
 * masthead grammar as the calculators so the site reads as one thing.
 */
export function ProsePage({
  kicker,
  title,
  lead,
  updated,
  sections,
  children,
}: {
  kicker: string;
  title: string;
  lead: string;
  updated?: string;
  sections?: ProseSection[];
  children?: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <header className="rise grid gap-x-10 gap-y-6 pt-12 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="kicker">{kicker}</span>
          <h1 className="mt-4 font-heading text-[clamp(2.5rem,6.5vw,4.25rem)] leading-[0.92] tracking-tight text-balance">
            {title}
          </h1>
        </div>
        <p className="max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground lg:pb-2">
          {lead}
        </p>
      </header>

      {updated && (
        <p className="kicker rule-t rule-b py-3">Last updated {updated}</p>
      )}

      {sections?.map((s) => (
        <section
          key={s.heading}
          className="mt-14 grid gap-x-12 gap-y-4 lg:grid-cols-[16rem_1fr]"
        >
          <h2 className="font-heading text-xl leading-tight tracking-tight">
            {s.heading}
          </h2>
          <div className="flex max-w-prose flex-col gap-4 text-[0.9375rem] leading-relaxed">
            {s.paragraphs?.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            {s.bullets && (
              <ul className="flex flex-col gap-2">
                {s.bullets.map((b) => (
                  <li
                    key={b.slice(0, 40)}
                    className="border-l-2 border-[var(--rule)] pl-4 text-muted-foreground"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      {/* Rendered after the prose: on /about/ the tool list is a footer to the
          explanation, not a preface to it. */}
      {children}
    </article>
  );
}
