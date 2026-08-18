import type { Metadata } from "next";

import { PtoCalculator } from "@/components/pto-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/pto-calculator/";

export const metadata: Metadata = {
  title: "PTO Calculator — Accrual, Balance and Payout",
  description:
    "A free PTO calculator. Work out how much paid time off you have accrued, what your vacation balance will be on a future date, and what the remaining hours are worth if they are paid out.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "PTO Calculator",
    description:
      "Track PTO accrual, project your vacation balance to any date, and value a payout.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How does PTO accrual work?",
    a: "Most employers credit a fixed amount of paid time off each pay period rather than handing you a year's worth on day one. Four hours every fortnight is a common rule, which comes to 104 hours — thirteen days — over a full year. This PTO accrual calculator counts the completed periods between your start date and the date you ask about, then multiplies by the rate.",
  },
  {
    q: "Why is my balance lower than I expected?",
    a: "Almost always because only completed periods count. If you accrue fortnightly and you are eleven days into a fortnight, that period has not credited yet — the hours appear on day fourteen, not gradually. A rough mental estimate spreads the accrual evenly and so runs ahead of the real balance for most of every period.",
  },
  {
    q: "How much PTO will I have by a specific date?",
    a: "Set the balance date to whatever day you are planning around — the start of a holiday, the end of the year, your last day — and the calculator projects forward from your accrual rule. This is the useful version of the question, because the number that matters is what you will have when you want to take the time, not what you have today.",
  },
  {
    q: "What does an annual cap do to my balance?",
    a: "A cap limits how much you can hold at once, not how much you can earn in a year. Once your balance reaches the cap, further accrual is lost until you take time off and drop back below it. Enter your cap and the calculator shows exactly how much has been forfeited — which is usually the moment people book a holiday.",
  },
  {
    q: "How do I calculate a PTO payout?",
    a: "Switch to Cash out, enter your hourly rate, and the remaining balance is converted to hours and multiplied by that rate. On 48 hours at $25 an hour that is $1,200 gross. Whether unused time is paid out at all depends on your contract and where you work — some places require it, many do not.",
  },
  {
    q: "What is the difference between PTO and vacation time?",
    a: "PTO usually means a single pot covering holiday, sick days, and personal time, while a vacation time calculator implies holiday is tracked separately from sick leave. The arithmetic is identical either way: a rate, a number of periods, and whatever you have already taken. Use this for either, or run it twice if your employer keeps separate balances.",
  },
  {
    q: "What is carryover?",
    a: "Time earned last year that you were allowed to bring into this one. Enter it in the carryover field and it is added before any cap is applied, which matters — carryover is frequently what pushes a balance up against the cap and starts quietly burning the accrual.",
  },
  {
    q: "Does this work out tax on a payout?",
    a: "No. The payout figure is gross. How a lump-sum payout is treated varies by country and situation, and this site does not calculate tax of any kind. Apply the effective rate from your own payslip if you want a rough net figure.",
  },
];

export default function PtoCalculatorPage() {
  return (
    <ToolPage
      slug="pto-calculator"
      kicker="Time off · Free tool"
      title={"PTO\nCalculator"}
      lead="Work out how much paid time off you have accrued, what the balance will be on any future date, and what the remaining hours are worth if they get paid out."
      methodsHeading="Accrual, projection, and payout"
      methodsLead="A PTO calculator, a vacation accrual calculator and a paid time off calculator all answer the same question from different directions: how many hours do I have, and when."
      methods={[
        {
          n: "I",
          title: "Accrual to date",
          body: "Your rate, your start date, and the periods that have actually completed. Carryover and time already taken come off, so the figure is the one you can actually book against.",
        },
        {
          n: "II",
          title: "Projected balance",
          body: "Set the balance date forward and the calculator projects to it. This is the number to check before booking: what you will have then, not what you have now.",
        },
        {
          n: "III",
          title: "Payout value",
          body: "Cash out mode converts the remaining balance to hours and multiplies by your hourly rate. Gross, and only as good as your contract's payout terms.",
        },
      ]}
      essay={{
        heading: "The cap is what costs people money",
        paragraphs: [
          "Accrual caps are the quietest way to lose pay. A cap is a ceiling on the balance you can hold, not on what you can earn in a year, so once you touch it every further period accrues into nothing. Nobody sends a notification when it starts happening; the balance simply stops moving while you carry on working.",
          "That is why the calculator reports forfeited time as its own line rather than folding it into the balance. If that number is above zero you are working days you will never be paid for, and the fix is usually to book time off before the next accrual lands. Carryover makes it worse, because time brought in from last year counts towards the cap on the first day of the new one.",
        ],
      }}
      faqs={FAQS}
    >
      <PtoCalculator />
    </ToolPage>
  );
}
