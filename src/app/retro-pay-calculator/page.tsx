import type { Metadata } from "next";

import { RetroPayCalculator } from "@/components/retro-pay-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/retro-pay-calculator/";

export const metadata: Metadata = {
  title: "Retro Pay Calculator — Back Pay After a Late Raise",
  description:
    "A free retro pay calculator. Work out the back pay owed when a raise is applied late: enter the old and new rate and the hours or pay periods affected.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Retro Pay Calculator",
    description: "Back pay owed when a raise lands late, hourly or salaried.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "What is retro pay?",
    a: "Money owed because you were paid at an old rate after a new one had taken effect. It happens most often when a raise is agreed in one month and processed in the next, or when a backdated pay award is settled. Retro pay is not a bonus — it is wages that were already earned and paid short.",
  },
  {
    q: "How do I calculate retro pay?",
    a: "Take the difference between the old and new rate, then multiply by everything paid at the old rate. Hourly: $2.50 an hour across 320 hours is $800. Salaried: work out the difference per pay period, then multiply by the number of periods that went out short.",
  },
  {
    q: "How do I work it out on a salary?",
    a: "Divide both annual figures by your number of pay periods a year, take the difference, and multiply by the periods affected. Going from $60,000 to $63,000 on fortnightly pay is $115.38 a period; five late periods is $576.92. Switch to Salary mode above and it does this for you.",
  },
  {
    q: "Does retro pay include overtime?",
    a: "It should. If the base rate rose, the overtime premium rose with it, so any overtime worked in the retro period was also underpaid. This calculator handles the base difference — for the overtime portion, run the hours through the time and a half calculator at both rates and take the difference.",
  },
  {
    q: "How far back can retro pay go?",
    a: "That depends on your contract and the law where you work, and there are usually limits on how far back a claim can reach. This calculator works out what the arithmetic produces for whatever period you enter; whether you are entitled to it, and for how long, is a question for your contract or an employment adviser.",
  },
  {
    q: "Is retro pay taxed differently?",
    a: "It is often withheld differently from regular wages, which is why a retro payment can look smaller than expected. This calculator shows the gross figure only — no tax rules of any kind are applied here, because they vary by country and situation.",
  },
  {
    q: "What if the rate went down?",
    a: "The calculator returns a negative figure rather than hiding it. That is usually a sign something is wrong with the inputs, since a backdated pay cut is rare and in many places not lawful without agreement.",
  },
];

export default function RetroPayCalculatorPage() {
  return (
    <ToolPage
      slug="retro-pay-calculator"
      kicker="Back pay · Free tool"
      title={"Retro Pay\nCalculator"}
      lead="Work out the back pay owed when a raise is applied late. Enter the old and new rate, then the hours or the pay periods that went out at the old one."
      methodsHeading="Two ways a raise arrives late"
      methodsLead="The arithmetic is the same either way — a difference multiplied by the amount of work paid short. What changes is the unit you count in."
      methods={[
        {
          n: "I",
          title: "Hourly",
          body: "The difference per hour times every hour worked in the retro period. Straightforward, and easy to check against a timesheet.",
        },
        {
          n: "II",
          title: "Salaried",
          body: "Both annual figures divided by pay periods, then multiplied by the periods that went out at the old salary. Count the payslips, not the weeks.",
        },
      ]}
      essay={{
        heading: "Check the payslip, not the promise",
        paragraphs: [
          "Retro pay disputes almost always come down to counting. The employer counts from the date the change was processed; the employee counts from the date it was agreed or the date it was meant to take effect. Those are frequently different, and the gap is exactly the amount in dispute.",
          "Before raising it, work out the figure yourself and be specific about the period: which payslips went out at the old rate, how many hours or periods that is, and what the difference comes to. A number with its working shown is a far easier conversation than a suspicion that something is missing, and it is often enough to get the correction made without any argument at all.",
        ],
      }}
      faqs={FAQS}
    >
      <RetroPayCalculator />
    </ToolPage>
  );
}
