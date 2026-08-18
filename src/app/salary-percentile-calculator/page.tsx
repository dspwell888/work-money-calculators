import type { Metadata } from "next";

import { SalaryPercentileCalculator } from "@/components/salary-percentile-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/salary-percentile-calculator/";

export const metadata: Metadata = {
  title: "Salary Percentile Calculator — Place a Salary in Your Own Data",
  description:
    "A free salary percentile calculator. Place a salary against published survey breakpoints or a list of real salaries, and get the percentile and compa-ratio. No market data is assumed.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Salary Percentile Calculator",
    description:
      "Percentile and compa-ratio against survey breakpoints or a list of salaries you supply.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "What does a salary percentile mean?",
    a: "It is the share of a group earning less than you. At the 60th percentile, 60% of the set earns less and 40% earns more. The number is only as meaningful as the set it is measured against — a percentile with no stated data source behind it means nothing at all.",
  },
  {
    q: "Why does this calculator not know what my job pays?",
    a: "Because nothing honest could. Market pay varies by country, city, industry, company size and year, and any figure baked into a page like this would be wrong for most visitors and stale within twelve months. This tool places a salary inside numbers you supply — from a survey you have access to, your own team, or offers you have collected.",
  },
  {
    q: "Where do I get survey breakpoints?",
    a: "Published compensation surveys quote quartiles: p25, p50, p75, sometimes p90. Industry bodies, recruiters, and government statistics offices all publish them, and larger employers buy them. Type the breakpoints in and the calculator interpolates between them.",
  },
  {
    q: "What is a compa-ratio?",
    a: "Your salary divided by the midpoint, usually the median. A compa-ratio of 1.00 means you are exactly at the midpoint; 0.90 means ten percent below it; 1.15 means fifteen percent above. Compensation teams use it constantly because it compares across different roles and bands in a way a raw salary cannot.",
  },
  {
    q: "What happens if my salary is above the highest breakpoint?",
    a: "The percentile is clamped to that breakpoint and flagged, rather than extrapolated. A survey that stops at p90 genuinely cannot tell you whether you are at p91 or p99, and inventing a number there would be the most misleading thing this page could do.",
  },
  {
    q: "How is the percentile calculated from a list?",
    a: "Everything strictly below your salary, plus half of anything exactly equal, divided by the count. That mid-rank convention is symmetric: it does not report the lowest and highest members as exactly 0 and 100 when they are tied with someone else.",
  },
  {
    q: "How accurate is the interpolation between breakpoints?",
    a: "It is a straight line between two points, and real salary distributions are not straight lines — they bunch near the median and stretch at the top. Treat a mid-band figure as approximate. A percentile sitting exactly on a breakpoint is exact; one interpolated between p75 and p90 is an estimate.",
  },
];

export default function SalaryPercentileCalculatorPage() {
  return (
    <ToolPage
      slug="salary-percentile-calculator"
      kicker="Compensation · Free tool"
      title={"Salary Percentile\nCalculator"}
      lead="Place a salary inside data you actually have — published survey breakpoints or a list of real salaries — and get the percentile and compa-ratio, with the working shown."
      methodsHeading="Two kinds of data you might have"
      methodsLead="Neither requires this site to know anything about your market, which is the point: a percentile is only as good as the set behind it, and you know your set."
      methods={[
        {
          n: "I",
          title: "Survey breakpoints",
          body: "Type the quartiles a published survey gives you — p25, p50, p75, p90 — and a salary is placed between them by interpolation.",
        },
        {
          n: "II",
          title: "A list of salaries",
          body: "Paste real figures: your team, a set of offers, a public pay disclosure. The percentile is exact for that set rather than interpolated.",
        },
        {
          n: "III",
          title: "Compa-ratio",
          body: "Your salary over the midpoint. The number compensation teams actually argue with, because it compares across bands and roles.",
        },
      ]}
      essay={{
        heading: "A percentile without a source is a number, not a fact",
        paragraphs: [
          "The most common way this metric misleads is silence about the set. \"You are at the 70th percentile\" invites the question: of whom? Of everyone in the country doing anything, of your title in your city, of the twelve people on your team? Those produce wildly different answers, and the difference is usually larger than the raise being discussed.",
          "So the useful discipline is to state the set alongside the number, every time. This calculator is built for that — it cannot produce a percentile without you naming the data, and the summary it copies out includes the breakpoints or the list you used. A percentile you can source is an argument; one you cannot is a feeling.",
        ],
      }}
      faqs={FAQS}
    >
      <SalaryPercentileCalculator />
    </ToolPage>
  );
}
