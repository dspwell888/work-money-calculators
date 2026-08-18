import type { Metadata } from "next";

import { HourlySalaryCalculator } from "@/components/hourly-salary-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/hourly-to-salary-calculator/";

export const metadata: Metadata = {
  title: "Hourly to Salary Calculator — Yearly, Monthly and Weekly Pay",
  description:
    "Convert an hourly rate into weekly, biweekly, monthly and yearly salary, or work backwards from a salary to the hourly rate it implies. Overtime and unpaid days included.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Hourly to Salary Calculator",
    description:
      "Turn an hourly rate into weekly, monthly, and annual pay — or go the other way, overtime included.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I convert an hourly rate to a yearly salary?",
    a: "Multiply the hourly rate by the hours you work each week, then by the weeks you work each year, and the result is your gross annual income. At $25 an hour, 40 hours a week, 52 weeks a year, that is 25 × 40 × 52 = $52,000 gross. Change any of the three and the annual figure changes with it, which is why this calculator asks for all three rather than assuming them.",
  },
  {
    q: "What is $25 an hour annually?",
    a: "$52,000 a year on a standard full-time schedule of 40 hours a week for 52 weeks. On 37.5 hours it is $48,750, and if you take two unpaid weeks it drops to $50,000. The rule of thumb — double the rate and add three zeros — gets you to $50,000, close enough for a first glance but not for a contract.",
  },
  {
    q: "How do I work out my hourly rate from a salary?",
    a: "Divide the annual salary by the total hours you work in a year. On $52,000 across 40 hours a week and 52 weeks, that is 2,080 hours, giving $25 an hour. Switch to Salary → hourly above and it does this for you, including the effect of unpaid time off.",
  },
  {
    q: "How many working hours are in a year?",
    a: "2,080 on the standard assumption of 40 hours for 52 weeks. That figure counts paid holiday as worked, which is normal for salaried roles. If you take unpaid time, subtract it: two unpaid weeks brings the total to 2,000 hours, and the calculator handles this through the unpaid days field.",
  },
  {
    q: "Should I use 52 weeks or fewer?",
    a: "Use 52 if your holiday is paid, because you are paid across the whole year. Reduce it only for genuinely unpaid weeks — common for contractors, term-time roles, and seasonal work. Getting this wrong is the single biggest source of error when people compare a contract rate against a salaried offer.",
  },
  {
    q: "Does overtime count towards my annual salary?",
    a: "Only if it is regular and paid, and it is worth separating out. Enter your usual weekly overtime hours and the multiplier, and the calculator shows how much of the annual figure comes from overtime. That portion is the part that disappears first when work slows down, so it is worth knowing before you rely on it for a mortgage application.",
  },
  {
    q: "Is this a net salary calculator?",
    a: "No, and deliberately not. Every figure here is gross pay. Tax rates, thresholds, and social contributions vary by country, state, and personal circumstances, and change every year — a tool that guessed at them would eventually be wrong in a way that costs you money. The optional field lets you apply your own effective deduction rate, read off your own payslip, for a rough scenario estimate.",
  },
];

export default function HourlyToSalaryCalculatorPage() {
  return (
    <ToolPage
      slug="hourly-to-salary-calculator"
      kicker="Pay conversion · Free tool"
      title={"Hourly to Salary\nCalculator"}
      lead="Turn an hourly rate into weekly, biweekly, monthly and yearly pay — or work backwards from a salary to the hourly rate it really implies, with overtime and unpaid time accounted for."
      methodsHeading="Both directions, honestly"
      methodsLead="A yearly salary calculator and an hourly paycheck calculator are the same arithmetic pointed opposite ways. What decides the answer is the hours and weeks you put in, which is why this payroll calculator asks for them rather than assuming a standard week."
      methods={[
        {
          n: "I",
          title: "Hourly → salary",
          body: "Rate times hours times weeks. Add regular paid overtime and it is included in the annual figure, shown separately so you know how much of your income depends on it.",
        },
        {
          n: "II",
          title: "Salary → hourly",
          body: "The reverse: an annual figure spread across the hours you actually work. Useful for checking whether a salaried offer really beats your current contract rate.",
        },
        {
          n: "III",
          title: "Unpaid time",
          body: "Subtract genuinely unpaid days from the year. Term-time, seasonal, and contract roles are all quietly worth less than a straight 52-week multiplication suggests.",
        },
      ]}
      essay={{
        heading: "Where the comparison goes wrong",
        paragraphs: [
          "Almost every bad hourly-versus-salary comparison comes down to weeks. A contractor at $40 an hour and a salaried employee at $83,200 look identical on a 52-week multiplication, but the contractor taking four unpaid weeks earns $76,800 for the same work, and that gap is before anything else is considered. Set the weeks honestly and the two numbers stop lying to you.",
          "The second thing to separate is overtime. Regular paid overtime is real money and belongs in the annual figure, but it is not the same as base pay: it is the first thing cut when demand falls, and lenders often discount or exclude it. The breakdown above splits it out for exactly that reason, so you can see both the number you earn and the number you can count on.",
        ],
      }}
      faqs={FAQS}
    >
      <HourlySalaryCalculator />
    </ToolPage>
  );
}
