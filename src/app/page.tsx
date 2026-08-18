import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SITE_NAME, SITE_URL, TOOLS, toolPath } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Free Pay and Time Calculators`,
  description:
    "Free calculators for pay, raises, and working time. Work out a salary increase, convert hours to decimal, or check overtime pay. No sign-up, and every calculation runs in your browser.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Free Pay and Time Calculators`,
    description:
      "Free calculators for pay, raises, and working time. No sign-up, nothing stored.",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function HomePage() {
  const live = TOOLS.filter((t) => !t.comingSoon);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description:
          "Free calculators for pay, raises, and working time. Everything runs in the browser.",
      },
      {
        "@type": "ItemList",
        name: "Pay and working time calculators",
        itemListElement: live.map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.title,
          url: `${SITE_URL}${toolPath(tool.slug)}`,
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

      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <header className="rise grid gap-x-10 gap-y-6 pt-16 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="kicker">Free · No sign-up · Runs in-browser</span>
            <h1 className="mt-4 max-w-2xl font-heading text-[clamp(2.5rem,6.5vw,4.25rem)] leading-[0.94] tracking-tight text-balance">
              Calculators for pay and working time
            </h1>
          </div>
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground lg:pb-2">
            Exact tools for the arithmetic that comes up around work and money.
            Nothing to install, nothing to sign, and no data leaves your
            browser.
          </p>
        </header>

        <section className="rise" style={{ animationDelay: "80ms" }}>
          <div className="rule-b pb-3">
            <h2 className="font-heading text-2xl tracking-tight">
              The calculators
            </h2>
          </div>
          <ul>
            {TOOLS.map((tool, i) =>
              tool.comingSoon ? (
                <li
                  key={tool.slug}
                  className="flex flex-col gap-1 border-b border-[var(--rule)] py-5 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <span className="kicker font-mono sm:w-8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted-foreground sm:w-64 sm:shrink-0">
                    {tool.title}
                  </span>
                  <span className="flex-1 text-sm text-muted-foreground">
                    {tool.blurb}
                  </span>
                  <span className="kicker">Soon</span>
                </li>
              ) : (
                <li key={tool.slug}>
                  <Link
                    href={toolPath(tool.slug)}
                    className="group flex flex-col gap-1 border-b border-[var(--rule)] py-5 transition-colors hover:bg-accent/50 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <span className="kicker font-mono sm:w-8">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium sm:w-64 sm:shrink-0">
                      {tool.title}
                    </span>
                    <span className="flex-1 text-sm text-muted-foreground">
                      {tool.blurb}
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="mt-20 grid gap-x-12 gap-y-4 lg:grid-cols-[16rem_1fr]">
          <h2 className="font-heading text-2xl leading-tight tracking-tight">
            Why these tools exist
          </h2>
          <div className="flex max-w-prose flex-col gap-4 text-[0.9375rem] leading-relaxed">
            <p>
              Most pay questions are simple arithmetic wearing a disguise. What
              is a 4% raise actually worth per paycheck? How many decimal hours
              is 7 hours 20 minutes? What does time and a half come to on a
              Sunday shift? None of it is hard, and all of it is easy to get
              wrong at speed.
            </p>
            <p className="text-muted-foreground">
              These calculators do that arithmetic exactly, show their working,
              and let you compare options side by side. They deliberately stop
              short of tax: rates change constantly and vary by where you live,
              so a tool that guessed them would quietly cost you money. Anything
              tax-related here uses a rate you supply yourself.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
