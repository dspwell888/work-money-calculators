import type { Metadata } from "next";

import { ProRataCalculator } from "@/components/pro-rata-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/pro-rata-calculator/";

export const metadata: Metadata = {
  title: "Pro Rata Calculator — Part-Time and Part-Year Salary",
  description:
    "Work out a pro rata salary from a full-time figure. Scale by contracted hours for a part-time role, or by weeks and months served when you join or leave mid-year.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Pro Rata Calculator",
    description:
      "Scale a full-time salary to part-time hours or to part of a year, by hours or by time served.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "What does pro rata actually mean on a job advert?",
    a: "It means the salary quoted is the full-time figure, and you will be paid the share of it that matches your hours. A role advertised at £50,000 pro rata for a three-day week pays £30,000, not £50,000. The full-time number is shown because it lets candidates compare roles on the same footing, not because anyone part-time will receive it.",
  },
  {
    q: "How do I calculate pro rata salary from hours?",
    a: "Divide your contracted hours by the full-time hours, then multiply by the full-time salary. For 24 hours against a full-time week of 40, that is 24 ÷ 40 = 0.6, so 60% of the full-time figure. The Hours worked mode above does exactly this.",
  },
  {
    q: "How do I work out pay for a partial year?",
    a: "Use the Time served mode. It scales the annual salary by the fraction of the year you are actually employed — seven months out of twelve, or eighteen weeks out of fifty-two. This is the calculation you want when you start a job in the spring, leave before year end, or are covering a fixed-term contract.",
  },
  {
    q: "Should I pro rate by weeks, months, or days?",
    a: "Use whichever unit your contract is written in. Months are the usual choice for salaried roles because pay runs monthly; weeks suit fixed-term contracts; days matter when a role starts or ends mid-month. The three give slightly different answers because months are not all the same length, so matching the contract avoids an argument later.",
  },
  {
    q: "Does pro rata affect holiday entitlement too?",
    a: "Normally yes, and by the same fraction — someone working three days a week typically accrues three fifths of the full-time holiday allowance. This calculator handles the salary side only. Check your contract or staff handbook for how leave is calculated where you work, because the rounding rules vary.",
  },
  {
    q: "Is the hourly rate the same part-time as full-time?",
    a: "It should be. That is the point of pro rating: the same rate for the same work, with the total scaled to the hours. The implied hourly rate is shown in the table above so you can check it against the full-time figure and spot a role that is quietly paying part-time staff less per hour.",
  },
  {
    q: "Does this calculate tax on the pro rata salary?",
    a: "No. Tax bands, thresholds, and rates differ by country and change every year, and part-year employment interacts with them in ways a generic tool would get wrong. Everything here is gross pay. Use your own payslip or an official calculator for the tax side.",
  },
];

export default function ProRataCalculatorPage() {
  return (
    <ToolPage
      slug="pro-rata-calculator"
      kicker="Part-time pay · Free tool"
      title={"Pro Rata\nCalculator"}
      lead="Turn a full-time salary into what you will actually be paid. Scale it by contracted hours for a part-time role, or by the time you serve when the job does not run a full year."
      methodsHeading="Two ways a salary gets pro rated"
      methodsLead="Both answer the same question — what fraction of the full-time figure applies — but they measure the fraction differently, and using the wrong one is how people end up disputing a payslip."
      methods={[
        {
          n: "I",
          title: "By hours worked",
          body: "For a permanent part-time contract. Your contracted hours divided by the full-time week gives the fraction, and the salary follows. Three days against five is 60%.",
        },
        {
          n: "II",
          title: "By time served",
          body: "For joining or leaving mid-year, or a fixed-term contract. The fraction is the part of the year you are employed — seven months out of twelve, or eighteen weeks out of fifty-two.",
        },
      ]}
      essay={{
        heading: "Read the advert carefully",
        paragraphs: [
          "The phrase that causes the most trouble is a salary quoted with pro rata tacked on the end and no hours stated anywhere in the advert. That figure is what a full-time person would earn. If the role is four days a week you will receive four fifths of it, and the difference is large enough that it is worth confirming before you accept — on a £50,000 headline that is £10,000 a year.",
          "The same applies in reverse when you leave. A contract ending in July does not pay the full annual figure, and a bonus or holiday balance is usually pro rated too. Working out the fraction yourself before the final payslip arrives is the cheapest way to catch an error, because the fraction is simple arithmetic and the payroll system that produced it is not.",
        ],
      }}
      faqs={FAQS}
    >
      <ProRataCalculator />
    </ToolPage>
  );
}
