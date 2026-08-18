import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";

import { AdSlot } from "@/components/ads";
import { AUTHORSHIP, OPERATOR, TOOL_DISCLAIMER } from "@/lib/legal";
import {
  getTool,
  relatedTools,
  SITE_NAME,
  SITE_URL,
  toolPath,
  toolUpdated,
} from "@/lib/site";

export interface Method {
  /** Roman numeral or short marker shown above the heading. */
  n: string;
  title: string;
  body: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Essay {
  heading: string;
  paragraphs: string[];
}

export interface ToolPageProps {
  slug: string;
  kicker: string;
  /** Rendered as the h1. Use a hard newline to control the display break. */
  title: string;
  lead: string;
  methodsHeading: string;
  methodsLead: string;
  methods: Method[];
  essay: Essay;
  faqs: Faq[];
  /** Extra editorial sections, rendered between the essay and the FAQ. */
  extra?: React.ReactNode;
  /** The interactive calculator — the only client component on the page. */
  children: React.ReactNode;
}

/**
 * Shared shell for every calculator page: masthead, methods, essay, FAQ,
 * internal links, and the JSON-LD graph. Everything here is a server
 * component, so it lands in the static HTML.
 */
export function ToolPage({
  slug,
  kicker,
  title,
  lead,
  methodsHeading,
  methodsLead,
  methods,
  essay,
  faqs,
  extra,
  children,
}: ToolPageProps) {
  const related = relatedTools(slug);
  const path = toolPath(slug);
  const titleLines = title.split("\n");
  const updated = toolUpdated(getTool(slug));

  // One publisher object, reused as author. No Person is emitted: inventing a
  // named individual would be worse than naming the operator that exists.
  const publisher = {
    "@type": "Organization",
    name: AUTHORSHIP.name,
    url: `${SITE_URL}/`,
    ...(OPERATOR.email ? { email: OPERATOR.email } : {}),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: titleLines.join(" "),
        url: `${SITE_URL}${path}`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: lead,
        author: publisher,
        publisher,
        dateModified: updated,
        isAccessibleForFree: true,
        disclaimer: TOOL_DISCLAIMER,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: titleLines.join(" "),
            item: `${SITE_URL}${path}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        author: publisher,
        publisher,
        dateModified: updated,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="pt-6">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                href="/"
                className="kicker underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Calculators
              </Link>
            </li>
            <ChevronRight
              aria-hidden
              className="size-3 text-muted-foreground"
            />
            <li aria-current="page" className="kicker text-foreground">
              {titleLines.join(" ")}
            </li>
          </ol>
        </nav>

        <header className="rise grid gap-x-10 gap-y-6 pt-6 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="kicker">{kicker}</span>
            <h1 className="mt-4 font-heading text-[clamp(2.5rem,6.5vw,4.25rem)] leading-[0.92] tracking-tight text-balance">
              {titleLines.map((line, i) => (
                <span key={line}>
                  {/* The trailing space matters: <br /> contributes no text
                      node, so without it the h1's textContent runs the words
                      together. */}
                  {line}
                  {i < titleLines.length - 1 && (
                    <>
                      {" "}
                      <br />
                    </>
                  )}
                </span>
              ))}
            </h1>
          </div>
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground lg:pb-2">
            {lead}
          </p>
        </header>

        <div className="rule-t rule-b mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
          <span className="kicker">
            Built and maintained by{" "}
            <Link
              href="/about/"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {AUTHORSHIP.name}
            </Link>
          </span>
          <span className="kicker">
            Last updated <time dateTime={updated}>{updated}</time>
          </span>
        </div>

        <div className="rise" style={{ animationDelay: "80ms" }}>
          {children}
        </div>

        <p className="mt-6 max-w-prose text-xs leading-relaxed text-muted-foreground">
          {TOOL_DISCLAIMER}{" "}
          <Link
            href="/about/"
            className="underline underline-offset-4 hover:no-underline"
          >
            How these calculators are built and checked
          </Link>
          .
        </p>

        <section className="mt-24">
          <div className="rule-b flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pb-3">
            <h2 className="font-heading text-2xl tracking-tight">
              {methodsHeading}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {methodsLead}
            </p>
          </div>
          <div
            className={
              methods.length === 2
                ? "grid sm:grid-cols-2"
                : "grid sm:grid-cols-3"
            }
          >
            {methods.map((m, i) => (
              <div
                key={m.title}
                className={`flex flex-col gap-2 py-6 sm:pr-8 ${
                  i > 0
                    ? "rule-t sm:border-t-0 sm:border-l sm:border-l-[var(--rule)] sm:pl-8"
                    : ""
                }`}
              >
                <span className="kicker font-mono">{m.n}</span>
                <h3 className="text-base font-medium">{m.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {m.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-x-12 gap-y-4 lg:grid-cols-[16rem_1fr]">
          <h2 className="font-heading text-2xl leading-tight tracking-tight">
            {essay.heading}
          </h2>
          <div className="flex max-w-prose flex-col gap-4 text-[0.9375rem] leading-relaxed">
            {essay.paragraphs.map((p, i) => (
              <p key={p.slice(0, 32)} className={i > 0 ? "text-muted-foreground" : ""}>
                {p}
              </p>
            ))}
          </div>
        </section>

        {extra}

        {/* Deliberately below the calculator, the methods, and the essay: an
            ad never sits between the reader and their answer. */}
        <AdSlot slot="1" label="Advertisement" />

        <section className="mt-20">
          <div className="rule-b pb-3">
            <h2 className="font-heading text-2xl tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="grid gap-x-12 md:grid-cols-2">
            {faqs.map((f, i) => (
              <div
                key={f.q}
                className="flex flex-col gap-2 border-b border-[var(--rule)] py-6"
              >
                <span className="kicker font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base leading-snug font-medium">{f.q}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="rule-b pb-3">
            <h2 className="font-heading text-2xl tracking-tight">
              Other calculators
            </h2>
          </div>
          <ul>
            {related.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={toolPath(tool.slug)}
                  className="group flex flex-col gap-1 border-b border-[var(--rule)] py-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <span className="font-medium sm:w-64 sm:shrink-0">
                    {tool.title}
                  </span>
                  <span className="flex-1 text-sm text-muted-foreground">
                    {tool.blurb}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
