import type { Metadata } from "next";

import { PrevailingWageCalculator } from "@/components/prevailing-wage-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/prevailing-wage-calculator/";

export const metadata: Metadata = {
  title: "Prevailing Wage Calculator — Base Rate Plus Fringe",
  description:
    "A free prevailing wage calculator. Enter the base and fringe rates from your wage determination, credit the benefits you provide, and get the cash owed including overtime handled correctly.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Prevailing Wage Calculator",
    description:
      "Base rate plus fringe, benefit credits, and overtime on the base rate only.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How is prevailing wage calculated?",
    a: "It has two parts: a basic hourly rate and a fringe rate, both set by the wage determination for that classification and locality. The base rate is paid in cash. The fringe can be satisfied with bona fide benefits, cash, or a mix — but whatever benefits fall short by must be paid in cash.",
  },
  {
    q: "Can I count benefits against the fringe rate?",
    a: "Yes, that is the point of the credit. If the determination calls for $12 an hour in fringe and you provide benefits worth $8 an hour, you owe the remaining $4 an hour in cash. Enter the hourly value of what you actually provide and the calculator shows the shortfall separately.",
  },
  {
    q: "Does overtime apply to the fringe rate too?",
    a: "No, and this is the mistake that appears most often on certified payroll. The overtime multiplier applies to the basic hourly rate only. The fringe rate is owed at straight time for every hour worked, overtime hours included — never multiplied, but never omitted from those hours either.",
  },
  {
    q: "What happens if my benefits are worth more than the fringe rate?",
    a: "You owe no cash fringe, and the excess is simply excess — the credit is capped at the determined fringe rate rather than reducing the base rate you owe. The calculator caps it for exactly this reason.",
  },
  {
    q: "Where do I find the rates for my job?",
    a: "On the wage determination attached to the contract. Rates are set per classification and per locality by the issuing authority and change over time, which is why this calculator asks for them rather than looking anything up. Using last year's figures, or figures for a neighbouring county, is a common and expensive error.",
  },
  {
    q: "What is the difference between the cash rate and the package?",
    a: "The cash rate is what has to be paid in money and what appears on certified payroll. The package adds the value of the benefits you provide. Both are shown because they answer different questions: the first is a compliance figure, the second is what the work actually costs you.",
  },
  {
    q: "Does this handle deductions or reporting?",
    a: "No. Every figure here is gross, and the tool produces arithmetic rather than a certified payroll form. Compliance requirements vary by contract and jurisdiction — check the determination and, where the amounts are material, take professional advice.",
  },
];

export default function PrevailingWageCalculatorPage() {
  return (
    <ToolPage
      slug="prevailing-wage-calculator"
      kicker="Public works · Free tool"
      title={"Prevailing Wage\nCalculator"}
      lead="Work out what is owed under a wage determination: base rate plus fringe, less the benefits you already provide, with overtime applied the way it actually works."
      methodsHeading="Two rates, and one rule people get wrong"
      methodsLead="A prevailing wage is a base rate and a fringe rate. The arithmetic is simple until overtime arrives, at which point the two behave completely differently."
      methods={[
        {
          n: "I",
          title: "Base rate",
          body: "Paid in cash for every hour, and the only figure the overtime multiplier ever touches. Taken from the determination for your classification and locality.",
        },
        {
          n: "II",
          title: "Fringe rate",
          body: "Satisfied with benefits, cash, or both. Whatever your benefits fall short by is owed in cash, for every hour worked including overtime.",
        },
        {
          n: "III",
          title: "Overtime",
          body: "Multiplier on the base rate only. Fringe is never multiplied — but it is never skipped on overtime hours either.",
        },
      ]}
      essay={{
        heading: "The two errors that show up on certified payroll",
        paragraphs: [
          "The first is multiplying the whole rate for overtime. On a $35 base with a $12 fringe, paying 1.5 times $47 an hour overstates what is due — the multiplier belongs to the $35 alone. It looks generous, it is not what the determination says, and it makes every other line on the payroll harder to defend.",
          "The second is the opposite: dropping the fringe from overtime hours entirely. Fringe is owed for every hour worked, at straight time, overtime included. Between the two mistakes, the second is the one that gets contractors into trouble, because it underpays. The table above keeps base and fringe on separate lines so neither error can hide inside a single total.",
        ],
      }}
      faqs={FAQS}
    >
      <PrevailingWageCalculator />
    </ToolPage>
  );
}
