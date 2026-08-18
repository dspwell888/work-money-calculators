import type { Metadata } from "next";

import { RealEstateCommissionCalculator } from "@/components/real-estate-commission-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/real-estate-commission-calculator/";

export const metadata: Metadata = {
  title: "Real Estate Commission Calculator — With Agent and Brokerage Splits",
  description:
    "A free real estate commission calculator. Work out the total commission on a sale, split it between the listing and buying sides, then split each side between agent and brokerage.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Real Estate Commission Calculator",
    description:
      "Total commission, side split, and each side's agent and brokerage share.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I calculate real estate commission?",
    a: "Multiply the sale price by the total commission rate. Five percent on a $500,000 sale is $25,000. That total is then divided between the two sides of the deal, and each side is divided again between the agent and their brokerage — which is why the number an agent takes home is much smaller than the headline figure.",
  },
  {
    q: "How is commission split between agents?",
    a: "The total usually splits between the listing side and the buying side, often evenly. Each side then splits with its own brokerage under whatever agreement that agent has — a 60/40 in the agent's favour is common, and newer agents are often on less. This realtor commission calculator works as a real estate agent commission calculator too: set the splits to your own agreement and the agent line is what you would actually receive.",
  },
  {
    q: "Does the agent get the whole listing side?",
    a: "No, and this is the most common misunderstanding. An agent on a 60% split takes 60% of their own side, not 60% of the total commission. On a $25,000 total split evenly, that is 60% of $12,500 — $7,500, not $15,000. The table above keeps the two apart deliberately.",
  },
  {
    q: "Who pays the commission?",
    a: "Traditionally it comes out of the sale proceeds, so the seller funds both sides. Arrangements vary by market and have been changing, and buyers increasingly negotiate their own agent's fee separately. The calculator shows the total coming off the sale price — adjust the side split to model whatever arrangement is in front of you.",
  },
  {
    q: "What is a typical commission rate?",
    a: "It varies by market and is always negotiable — there is no standard rate, and treating one as fixed is a good way to overpay. Run your own figure through the rate field and watch the effect on the net to seller line, which is the number that actually matters to the person selling.",
  },
  {
    q: "Does this include closing costs or fees?",
    a: "No. The seller line shows the sale price less commission only. Transfer taxes, legal fees, title costs and repairs all come off separately and vary widely by location. Treat the figure here as the commission part of the picture, not the whole settlement.",
  },
  {
    q: "Are these figures before tax?",
    a: "Yes. Everything shown is gross. What an agent or brokerage owes on their share depends on how they are structured and where they operate, and this site does not calculate tax of any kind.",
  },
];

export default function RealEstateCommissionCalculatorPage() {
  return (
    <ToolPage
      slug="real-estate-commission-calculator"
      kicker="Property · Free tool"
      title={"Real Estate\nCommission Calculator"}
      lead="Work out the total commission on a sale and follow it all the way down: split between the two sides, then each side split between the agent and their brokerage."
      methodsHeading="Three steps, in the order the money moves"
      methodsLead="Most calculators stop at the total. The number an agent actually receives is two splits further down, and getting the order wrong roughly doubles it."
      methods={[
        {
          n: "I",
          title: "Total commission",
          body: "Sale price times the total rate. This is the amount coming out of the proceeds, and the figure that determines what the seller keeps.",
        },
        {
          n: "II",
          title: "Split between sides",
          body: "The total divides between the listing side and the buying side — often evenly, but adjustable here because it frequently is not.",
        },
        {
          n: "III",
          title: "Agent and brokerage",
          body: "Each side splits again under that agent's own agreement. An agent's percentage applies to their side, never to the whole commission.",
        },
      ]}
      essay={{
        heading: "The number that surprises people",
        paragraphs: [
          "On a $500,000 sale at 5%, the commission is $25,000 — a figure that sounds enormous to a seller and is quoted constantly in that form. Split evenly between two sides, each side has $12,500. An agent on a 60/40 split with their brokerage takes $7,500 of it, before any of their own costs, and before whatever they owe in tax.",
          "Both parties tend to argue from the wrong end of that chain: sellers from the $25,000, agents from the $7,500. Neither figure is wrong, they are just four steps apart, and having all four on screen at once is the fastest way to make a negotiation about commission a rational one.",
        ],
      }}
      faqs={FAQS}
    >
      <RealEstateCommissionCalculator />
    </ToolPage>
  );
}
