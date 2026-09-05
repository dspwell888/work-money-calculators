import type { Metadata } from "next";

import { FreelanceRateCalculator } from "@/components/freelance-rate-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/freelance-rate-calculator/";

export const metadata: Metadata = {
  title: "Freelance Rate Calculator — Day Rate and Hourly Rate",
  description:
    "A free freelance rate calculator and contractor calculator. Work back from the income you want, your business costs and your realistic billable days to the day rate and hourly rate you need to charge.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Freelance Rate Calculator",
    description:
      "Target income, costs, and utilisation worked back into a day rate and hourly rate.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I work out my freelance rate?",
    a: "Start from what you want to earn, add your business costs, gross that figure up for a profit margin if you want one, then divide by the hours you can realistically bill. The last step is where most people go wrong: dividing by 2,080 hours assumes every working hour is billable, and none of them are.",
  },
  {
    q: "What is utilisation and why does it matter so much?",
    a: "It is the share of your working days you actually bill for. Selling, invoicing, admin, and learning all take days you cannot charge for, and they have to be paid out of the days you can. At 70% utilisation, 230 working days become 161 billable ones — so your rate has to carry 69 unpaid days.",
  },
  {
    q: "What utilisation should I assume?",
    a: "Seventy percent is a reasonable planning figure for an established freelancer with steady work. Fifty is more honest for a first year, when finding clients takes most of the time. Set it low and you will be pleasantly wrong; set it at ninety and you will be quoting a rate that cannot cover your year.",
  },
  {
    q: "Why is a contractor rate higher than the equivalent salary?",
    a: "Because it has to cover things an employer would otherwise pay for: holiday, sick days, pension, equipment, insurance, and the gaps between contracts. A contractor calculator that simply converts a salary to an hourly rate ignores all of that, which is how people end up taking a large effective pay cut while thinking they got a raise.",
  },
  {
    q: "Should I charge by the hour or by the day?",
    a: "Both figures are shown because clients ask for different ones. Day rates suit longer engagements and are easier to plan against; hourly suits fragmented work. Whichever you quote, derive it from the same annual arithmetic so the two are consistent — quoting a day rate that is not eight times your hourly rate invites an awkward question.",
  },
  {
    q: "Does this include tax?",
    a: "No. The target income figure is what you want the business to pay you before tax, and tax comes out of it afterwards. Rates and structures vary enormously by country and how you are set up, so this calculator deliberately stops at gross. Speak to an accountant about what to set aside.",
  },
  {
    q: "Should I add a profit margin on top?",
    a: "It is worth considering. A margin above your income and costs is what funds slow quarters, equipment replacement, and eventually not working. Treating your target income as the ceiling rather than the floor is a common reason freelance businesses never build any reserve.",
  },
];

export default function FreelanceRateCalculatorPage() {
  return (
    <ToolPage
      slug="freelance-rate-calculator"
      kicker="Self-employment · Free tool"
      title={"Freelance Rate\nCalculator"}
      lead="Work back from the income you want to the rate you have to charge, with your real business costs and the days you can honestly expect to bill."
      methodsHeading="Rate is an output, not a guess"
      methodsLead="A freelance rate calculator and a contractor calculator answer the same question in reverse: not what is my time worth, but what must I charge for the year to work."
      methods={[
        {
          n: "I",
          title: "What you need",
          body: "The income you want plus the costs of running the business, plus a margin if you want reserves. This is the revenue the year has to produce.",
        },
        {
          n: "II",
          title: "What you can bill",
          body: "Working days multiplied by utilisation. The non-billable days do not disappear — they get paid for out of the billable ones.",
        },
        {
          n: "III",
          title: "The rate that follows",
          body: "Revenue divided by billable hours. Change utilisation by ten points and watch the rate move; that sensitivity is the whole point.",
        },
      ]}
      essay={{
        heading: "The 2,080-hour mistake",
        paragraphs: [
          "The most expensive error in freelancing is dividing a target income by 2,080 hours. It assumes fifty-two paid weeks, every hour billable, no unpaid gaps, and no costs. Someone wanting $80,000 arrives at $38 an hour, quotes it, wins work, and discovers around month nine that the year does not close.",
          "The honest version subtracts the days you cannot bill before it divides. The same $80,000, with $10,000 of costs and 70% utilisation across 230 working days, needs about $70 an hour — nearly double. That is not greed, it is the same annual income with the unbillable time and the costs put back in where they belong.",
        ],
      }}
      faqs={FAQS}
    >
      <FreelanceRateCalculator />
    </ToolPage>
  );
}
