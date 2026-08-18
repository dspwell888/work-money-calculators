import type { Metadata } from "next";

import { WageInflationCalculator } from "@/components/wage-inflation-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/wage-inflation-calculator/";

export const metadata: Metadata = {
  title: "Wage Inflation Calculator — Has Your Pay Kept Up?",
  description:
    "A free wage inflation calculator. Compare a salary then and now against the inflation rate you supply, and see the real change, the break-even salary, and real growth per year.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Wage Inflation Calculator",
    description:
      "What a raise was really worth once prices are taken out of it.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I work out whether my pay has kept up with inflation?",
    a: "Compound the inflation rate over the period, multiply your starting salary by it, and compare that figure to what you earn now. If you earn more, you are ahead in real terms; if less, a nominal raise has still been a pay cut. The break-even line above is exactly that figure.",
  },
  {
    q: "What is the difference between nominal and real pay?",
    a: "Nominal is the number on the payslip. Real is what it buys. A 16% rise over five years while prices rose 16% leaves you exactly where you started in real terms, even though the salary is visibly larger. Real figures here are expressed in starting-year money so the two are directly comparable.",
  },
  {
    q: "Why does the calculator not know the inflation rate?",
    a: "Because there is no single correct one. CPI differs by country, gets revised after publication, and the right average for your period depends on exactly which years you are spanning. A rate baked into this page would be wrong for most visitors and stale within a year. Take an average annual figure from your national statistics office and type it in.",
  },
  {
    q: "Why is five years at 3% not 15%?",
    a: "Because inflation compounds. Each year's rise applies to the already-risen prices, so five years at 3% is 15.93%, not 15%. Over ten years the gap widens to 34.4% against a naive 30%. This is the main reason long stretches without a raise cost more than people estimate.",
  },
  {
    q: "What is real growth per year?",
    a: "The compound annual growth of your salary after inflation is removed. It is the cleanest single number for a long period: a real growth rate near zero means a decade of raises that only tracked prices, however large the nominal increases looked at the time.",
  },
  {
    q: "Should I use this before a pay review?",
    a: "It is useful preparation. Knowing that standing still requires a specific figure changes the conversation from a general request into a concrete one — and if your salary has fallen behind, the break-even number is the floor of what you are asking for rather than the ceiling.",
  },
  {
    q: "Does this account for tax?",
    a: "No. Both figures are gross and the comparison is between two gross salaries. Tax bands often shift with inflation too, but not always at the same rate, and this site does not calculate tax of any kind.",
  },
];

export default function WageInflationCalculatorPage() {
  return (
    <ToolPage
      slug="wage-inflation-calculator"
      kicker="Real pay · Free tool"
      title={"Wage Inflation\nCalculator"}
      lead="Find out what a raise was really worth. Compare a salary then and now against the inflation rate you supply, and see the figure you would have needed just to stand still."
      methodsHeading="Three numbers worth knowing"
      methodsLead="A raise that looks large and a raise that gains you anything are different things, and the gap between them is the whole subject of this page."
      methods={[
        {
          n: "I",
          title: "The break-even salary",
          body: "What you would need today simply to match what you had. Anything below it is a real-terms pay cut, however the nominal figure looks.",
        },
        {
          n: "II",
          title: "Today's pay in old money",
          body: "Your current salary discounted back to starting-year prices. This is the like-for-like comparison against where you began.",
        },
        {
          n: "III",
          title: "Real growth a year",
          body: "Compound annual growth with inflation stripped out. The single cleanest figure for judging a long stretch of raises.",
        },
      ]}
      essay={{
        heading: "Compounding runs in both directions",
        paragraphs: [
          "Most people estimate this arithmetic linearly and get it wrong in the same direction every time. Five years at 3% feels like 15% and is actually 15.93%; ten years feels like 30% and is 34.4%. The error grows with the period, which means the longer you go without checking, the more you underestimate what you have lost.",
          "The same compounding works for you once pay starts moving. A raise that beats inflation by two points a year does not add two points — it compounds, and over a decade it is the difference between a career that gained ground and one that only kept pace. The real growth figure above is the number that tells you which one you have had.",
        ],
      }}
      faqs={FAQS}
    >
      <WageInflationCalculator />
    </ToolPage>
  );
}
