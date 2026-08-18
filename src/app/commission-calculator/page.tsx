import type { Metadata } from "next";

import { CommissionCalculator } from "@/components/commission-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/commission-calculator/";

export const metadata: Metadata = {
  title: "Commission Calculator — Flat Rate, Tiered, and Base Plus Commission",
  description:
    "Work out sales commission at a flat rate or across tiered bands, add base pay for total earnings, and see the effective rate your plan actually pays.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Commission Calculator",
    description:
      "Commission on sales at a flat or tiered rate, with base pay and on-target earnings.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I calculate commission on sales?",
    a: "Multiply the sales figure by the commission rate as a decimal. Five percent on $250,000 is 0.05 × $250,000 = $12,500. If your plan has tiers, each band of sales earns its own rate and the results are added, which is what the Tiered mode above does.",
  },
  {
    q: "What is tiered commission and how does it work?",
    a: "The rate steps up as sales pass thresholds, and each band is paid at its own rate on the sales that fall inside it. On a 3% / 5% / 8% plan with thresholds at $100k and $250k, sales of $300k earn 3% on the first $100k, 5% on the next $150k, and 8% on the last $50k. It is the same shape as a progressive tax band, and it is the standard way plans are written.",
  },
  {
    q: "Why is my effective rate lower than my top tier?",
    a: "Because only the sales above the top threshold earn the top rate. Hitting an 8% tier does not mean 8% on everything — it means 8% on the portion above the threshold. The effective rate shown above is your commission divided by total sales, which is the number to use when comparing two plans.",
  },
  {
    q: "What is OTE, and is it the same as this total?",
    a: "On-target earnings is base pay plus the commission you would earn hitting quota exactly. Enter your base and your quota as the sales figure and the total shown here is your OTE. Actual earnings differ whenever actual sales differ, which is the whole point of a commission plan.",
  },
  {
    q: "Does a higher rate always mean a better plan?",
    a: "No, and this is where plans are most often misread. A flat 5% can beat a tiered plan topping out at 10% if the thresholds are set where you will not reach them. Put both structures in this calculator using the sales you realistically expect, and compare the totals rather than the headline rates.",
  },
  {
    q: "What about a draw against commission?",
    a: "A draw is an advance on future commission, not extra money — it is recovered from what you earn later. This calculator shows what a period earns, which is the figure a draw is settled against. Whether an unearned draw is recoverable from you depends on your contract.",
  },
  {
    q: "Does this account for tax on commission?",
    a: "No. Every figure here is gross. Commission is often withheld differently from regular salary, which is why a commission cheque can look smaller than expected, but withholding rules vary by country and situation and this tool deliberately does not guess at them.",
  },
];

export default function CommissionCalculatorPage() {
  return (
    <ToolPage
      slug="commission-calculator"
      kicker="Sales pay · Free tool"
      title={"Commission\nCalculator"}
      lead="Work out what a commission plan actually pays. Use a flat rate or build the tiers your plan uses, add base pay for total earnings, and see the effective rate across all your sales."
      methodsHeading="Two structures, and the number that compares them"
      methodsLead="Most plans are one of two shapes. The figure worth comparing across them is not the headline rate — it is the effective rate on the sales you actually expect to make."
      methods={[
        {
          n: "I",
          title: "Flat rate",
          body: "One percentage on every dollar of sales. Simple to predict, and often better than it looks against a tiered plan whose thresholds sit out of reach.",
        },
        {
          n: "II",
          title: "Tiered bands",
          body: "The rate steps up past each threshold, and each band pays its own rate on the sales inside it. Build up to four bands and see exactly where the money comes from.",
        },
        {
          n: "III",
          title: "Base plus commission",
          body: "Add base pay to get total earnings for the period. Enter quota as the sales figure and the total is your on-target earnings.",
        },
      ]}
      essay={{
        heading: "Read the plan, not the headline",
        paragraphs: [
          "The number recruiters quote is the top tier, and the top tier almost never applies to your whole book. A plan advertised as paying up to 10% may pay an effective 4% on realistic numbers, because the 10% band only opens above a threshold most of the team does not reach. The band-by-band table above exists to make that visible before you sign rather than after your first quarter.",
          "The comparison worth doing takes two minutes: put your honest expected sales into this calculator under each plan you are weighing up, and compare total earnings rather than rates. Do it again at 70% of that number, because that is what a bad quarter looks like, and a plan that is only good at full quota is a plan that pays badly most of the year.",
        ],
      }}
      faqs={FAQS}
    >
      <CommissionCalculator />
    </ToolPage>
  );
}
