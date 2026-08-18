import type { Metadata } from "next";

import { RaiseCalculator } from "@/components/raise-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/salary-increase-calculator/";

export const metadata: Metadata = {
  title: "Salary Increase Calculator — Work Out Your Pay Raise",
  description:
    "Free salary increase calculator. Enter your current pay and a raise percentage, a flat pay increase, or a target salary — and see your new pay per hour, week, month, and year. Compare up to three raise scenarios side by side.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Salary Increase Calculator — Work Out Your Pay Raise",
    description:
      "Calculate a pay raise three ways: by percentage, by flat increase, or by target salary. Compare scenarios side by side.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I calculate a salary increase percentage?",
    a: "Subtract your current salary from your new salary, divide the result by your current salary, then multiply by 100. For example, going from $60,000 to $63,000 is a $3,000 increase; $3,000 ÷ $60,000 = 0.05, which is a 5% pay raise. The Target pay mode above does this for you in reverse: type the salary you want and it shows the raise percentage it would take to get there.",
  },
  {
    q: "How much is a 5% raise on my current pay?",
    a: "Multiply your current pay by 1.05. On $60,000 a year that is $63,000, an extra $3,000 a year or roughly $115 more per biweekly paycheck. Switch the calculator to your own pay period and it shows the increase per paycheck as well as per year.",
  },
  {
    q: "How do I work out a pay raise on an hourly wage?",
    a: "A wage increase works the same way as a salary increase: the percentage applies to your hourly rate. Set the pay period to Per hour and enter your rate. Because the calculator also asks for your hours per week and weeks per year, it can show the same raise as an hourly rate, a weekly figure, and an annual figure at the same time.",
  },
  {
    q: "My raise was given as a dollar amount, not a percentage. What percentage is it?",
    a: "Use the Flat increase mode. Enter the amount you were offered and choose the period it applies to — an extra $2 per hour and an extra $4,000 per year are very different raises, and the calculator converts both to the same annual basis before working out the percentage.",
  },
  {
    q: "How do I compare two job offers or two raise scenarios?",
    a: "Use Compare another to add a second or third scenario. Each one can use a different method, so you can put a 4% raise next to a $5,000 offer next to a target salary of $80,000 and read the results in one table. The scenarios all share your current pay and work schedule, so the comparison stays honest.",
  },
  {
    q: "Does this calculator work out my pay after tax?",
    a: "No, and that is deliberate. This tool does not use tax tables, withholding rules, or rates for any country or state, because those change constantly and a wrong number here would cost you real money. There is an optional field where you can type your own effective deduction rate — read it off your payslip — to see a rough scenario estimate. Treat it as arithmetic on a number you supplied, not as a tax calculation.",
  },
  {
    q: "What is a real raise, and why can a pay rise leave you worse off?",
    a: "A real raise is what is left of your increase once prices are taken out of it. If your pay goes up 3% while prices go up 4%, the number on your payslip is bigger but it buys less than last year's did — a nominal rise and a real-terms pay cut at the same time. The After inflation panel above shows both figures and the change in buying power in money, so the gap is visible rather than something you have to feel.",
  },
  {
    q: "How do you work out the inflation-adjusted raise?",
    a: "By dividing rather than subtracting: (1 + your raise) ÷ (1 + inflation), minus one. On a 3% raise against 4% inflation that is −0.96%, where the familiar shortcut of subtracting gives −1%. Both are shown, because the shortcut is what people say out loud, but the exact figure is the one used for the money — the new salary deflated by prices, compared with the old one. Enter the inflation rate for your own country and period; nothing is assumed or fetched.",
  },
  {
    q: "What counts as a good pay raise?",
    a: "That depends on inflation, your market, and your role, and no calculator can answer it for you. What this one can do is show the real size of what is on the table: the increase per paycheck, the increase per year, and how two or three options compare once they are on the same annual basis. A raise that sounds small as a percentage can look different as an annual figure, and the reverse is also true.",
  },
];

export default function SalaryIncreaseCalculatorPage() {
  return (
    <ToolPage
      slug="salary-increase-calculator"
      kicker="Pay & compensation · Free tool"
      title={"Salary Increase\nCalculator"}
      lead="Work out exactly what a pay raise is worth. Calculate it three ways — by raise percentage, by flat pay increase, or by the target salary you are aiming for — then put up to three scenarios side by side."
      methodsHeading="Three ways to calculate a pay increase"
      methodsLead="A pay raise calculator, a salary raise calculator and a wage increase calculator all do the same arithmetic — the name changes, the maths does not. What actually differs is the number you start from, so this pay increase calculator works from all three."
      methods={[
        {
          n: "I",
          title: "From a raise percentage",
          body: "The usual case: your employer names a percentage. Enter it and you get your new wage or salary plus the cash value of the raise, per paycheck and per year.",
        },
        {
          n: "II",
          title: "From a flat increase",
          body: "When the offer is “another $3,000” or “a dollar more an hour”, enter the amount and its period. The calculator works out what percentage raise that actually is.",
        },
        {
          n: "III",
          title: "From a target salary",
          body: "Preparing to ask for a number? Enter the salary you want and the calculator reverses the maths to show the raise percentage and the increase it would take.",
        },
      ]}
      essay={{
        heading: "Why the pay period matters",
        paragraphs: [
          "Most pay raise calculators assume you think in annual salary. Real raises rarely arrive that way. You might be quoted an hourly wage increase, paid every two weeks, and comparing it to a monthly figure from another employer. Those numbers are not comparable until they sit on the same annual basis.",
          "This calculator converts everything through your annual pay before it compares anything, using the hours per week and weeks per year you set. If you work 37.5 hours rather than 40, or take unpaid weeks, change those fields and every result updates — including the hourly rate implied by a salary increase.",
        ],
      }}
      faqs={FAQS}
    >
      <RaiseCalculator />
    </ToolPage>
  );
}
