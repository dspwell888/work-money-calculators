import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/prose-page";
import { AUTHORSHIP, OPERATOR, TOOL_DISCLAIMER } from "@/lib/legal";
import {
  SITE_NAME,
  SITE_UPDATED,
  SITE_URL,
  TOOLS,
  toolPath,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Who Builds These Calculators and How",
  description:
    "Who runs this site, how the calculators are built and checked, the formulas behind them, and why they deliberately stop short of calculating tax.",
  alternates: { canonical: "/about/" },
  openGraph: {
    title: `About ${SITE_NAME}`,
    description: "Who builds these calculators, how they are checked, and what they will not do.",
    url: `${SITE_URL}/about/`,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function AboutPage() {
  const contact = OPERATOR.email;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}/about/`,
    dateModified: SITE_UPDATED,
    publisher: {
      "@type": "Organization",
      name: AUTHORSHIP.name,
      url: `${SITE_URL}/`,
      ...(contact ? { email: contact } : {}),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ProsePage
        kicker="About"
        title="About this site"
        lead="Twenty calculators for pay and working time, built to be exact, fast, and honest about what they will not do."
        updated={SITE_UPDATED}
        sections={[
          {
            heading: "Who runs it",
            paragraphs: [
              `${SITE_NAME} is built and maintained by ${AUTHORSHIP.name}. ${AUTHORSHIP.role}.`,
              AUTHORSHIP.standing,
              contact
                ? `Corrections and questions go to ${contact}, and they are read. A reproducible arithmetic error is the single most useful thing anyone can send.`
                : "A contact address will be published here before this site goes live.",
            ],
          },
          {
            heading: "Why it exists",
            paragraphs: [
              "Most pay questions are simple arithmetic wearing a disguise, and most of the tools that answer them are worse than they need to be: one input box, an answer with no working shown, and three adverts between you and the number.",
              "These try to be the opposite. They show the working, handle the cases real payslips actually contain — night shifts crossing midnight, accrual caps, tiered commission, weekly overtime on a fortnightly card — and load fast enough that you get your answer before you have finished reading the page. Every one runs entirely in your browser: no account, no database, and nothing you type leaves your device.",
            ],
          },
          {
            heading: "What the formulas are",
            paragraphs: [
              "Each page states the formula it uses in plain words, next to the result it produces, because a number you cannot check is a number you should not act on. Pay periods are always converted through an annual figure before anything is compared, so an hourly increase and a salary increase can be put side by side honestly.",
              "Where a convention could reasonably go either way, the choice is written down rather than buried. Overtime is calculated per week, never averaged across a fortnightly card. Billable time rounds up per entry, the way it is actually billed. A raise against inflation uses the exact form rather than subtracting one percentage from the other. The full list of these decisions, with the reasoning, lives in the project's CONVENTIONS document.",
            ],
          },
          {
            heading: "How they are checked",
            paragraphs: [
              "The arithmetic in each calculator lives in a plain TypeScript module with no interface attached, and every module has a test suite covering the worked examples printed on its page, the awkward edge cases, and the conversions that must round-trip — a time converted to decimal and back has to return the original time. Those tests run on every change; there are currently more than two hundred of them.",
              "That is not a claim of authority, it is a claim about process. The tests exist because a shipped bug turned 7:20 into 7.33 into 7:19, and because a percentile calculator that extrapolates past the end of its data would mislead people about their own pay. Both are now impossible to reintroduce without a test failing.",
            ],
          },
          {
            heading: "Why there is no tax calculation",
            paragraphs: [
              "This is the most common question, and the answer is deliberate. Tax rates, thresholds, and contribution rules differ by country, by state or region, and by personal circumstance, and they change every year. A calculator that guessed at them would produce a confident, wrong number that someone might use to accept a job offer or dispute a payslip.",
              "So these tools work in gross pay. Where a take-home figure appears, it applies only a percentage you supply yourself — read off your own payslip — and says plainly that it is a scenario estimate rather than a tax calculation. The same rule covers inflation rates, salary survey data, mileage rates, and prevailing wage determinations: all of them are inputs you control, none of them are baked in. That restriction rules out some of the most-searched calculators on the internet. It is worth it.",
            ],
          },
          {
            heading: "What this is not",
            paragraphs: [
              TOOL_DISCLAIMER,
              "Nothing here decides whether you are entitled to overtime, whether a commission plan is enforceable, or whether a raise is fair. Those are questions about your contract and your jurisdiction. Before acting on a figure produced here — accepting an offer, disputing a payslip, signing a contract — check it against your actual contract and, where money or rights are at stake, take professional advice.",
            ],
          },
          {
            heading: "How it is paid for",
            paragraphs: [
              "The tools are free and will stay free. Running costs are intended to be covered by advertising. Ads will never sit between you and the answer, never move the page as it loads, and never require you to accept anything to see a result.",
            ],
          },
        ]}
      >
        <section className="mt-14">
          <div className="rule-b pb-3">
            <h2 className="font-heading text-xl tracking-tight">
              The calculators
            </h2>
          </div>
          <ul>
            {TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={toolPath(tool.slug)}
                  className="flex flex-col gap-1 border-b border-[var(--rule)] py-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <span className="font-medium sm:w-64 sm:shrink-0">
                    {tool.title}
                  </span>
                  <span className="flex-1 text-sm text-muted-foreground">
                    {tool.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </ProsePage>
    </>
  );
}
