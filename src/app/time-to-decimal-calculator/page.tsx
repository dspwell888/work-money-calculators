import type { Metadata } from "next";

import { TimeDecimalCalculator } from "@/components/time-decimal-calculator";
import { ToolPage } from "@/components/tool-page";
import { COMMON_MINUTES, formatDecimal } from "@/lib/time-decimal";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/time-to-decimal-calculator/";

export const metadata: Metadata = {
  title: "Time to Decimal Calculator — Hours and Minutes to Decimal Hours",
  description:
    "Convert hours and minutes to decimal hours, or decimal back to time. Add a whole timesheet, apply your employer's payroll rounding, and get the total in one place.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Time to Decimal Calculator",
    description:
      "Convert hours and minutes to decimal hours and back, with payroll rounding and a running timesheet total.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I convert hours and minutes to decimal?",
    a: "To convert hours to decimal, divide the minutes by 60 and add the result to the hours. 7 hours 20 minutes becomes 20 ÷ 60 = 0.333, so 7.33 decimal hours. The reason payroll wants it this way is that 7.20 would be read as seven and a fifth hours, which is twelve minutes out.",
  },
  {
    q: "What is 7 hours 30 minutes in decimal?",
    a: "7.5. Half an hour is 0.5 of an hour, so any figure ending in 30 minutes ends in .5. The other quarters are just as easy to remember: 15 minutes is 0.25, 45 minutes is 0.75.",
  },
  {
    q: "How do I convert decimal hours back to hours and minutes?",
    a: "Keep the whole number as hours, then multiply what is left by 60 to get minutes. 7.33 hours is 7 hours plus 0.33 × 60 = 19.8, which rounds to 20 minutes. Switch this calculator to Decimal → time and it does the conversion, including the rounding, for you.",
  },
  {
    q: "Why does my timesheet total not match my pay?",
    a: "Usually rounding. Many employers round each entry to the nearest quarter hour or tenth of an hour before paying it, so a string of 7:52 days does not add up the way raw arithmetic suggests. Set the rounding option to match your employer's rule and the total here will match the one on your payslip.",
  },
  {
    q: "What is a tenth of an hour?",
    a: "Six minutes. Rounding to the nearest tenth of an hour is common in professional services and legal billing, where time is logged as 0.1, 0.2, 0.3 and so on. Fifteen-minute rounding, a quarter of an hour, is more common in hourly and shift work.",
  },
  {
    q: "Can I convert a whole week at once?",
    a: "Yes. Use Add entry to build up as many rows as you need — one per shift or per day — and the panel keeps a running total underneath. Each row is rounded individually first, which is how payroll systems do it, so the total reflects what you would actually be paid rather than a rounded version of the raw sum.",
  },
  {
    q: "What formats can I type in?",
    a: "The entry field accepts the ways people actually write time: 7:20, 7.33, 7h20, 7 h 20 m, 7 20, and 450m for bare minutes. If a row cannot be read it says so rather than silently counting as zero.",
  },
];

function ReferenceTable() {
  return (
    <div className="mt-20">
      <div className="rule-b pb-3">
        <h2 className="font-heading text-2xl tracking-tight">
          Minutes to decimal hours, at a glance
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-md text-sm">
          <thead>
            <tr className="rule-b">
              <th scope="col" className="py-3 pr-4 text-left font-medium">
                Minutes
              </th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">
                Decimal
              </th>
              <th scope="col" className="py-3 pl-4 text-left font-medium">
                Common name
              </th>
            </tr>
          </thead>
          <tbody>
            {COMMON_MINUTES.map((m) => (
              <tr key={m} className="border-t border-[var(--rule)]">
                <th
                  scope="row"
                  className="py-2 pr-4 text-left font-normal text-muted-foreground"
                >
                  {m} min
                </th>
                <td className="py-2 pr-4 text-right font-mono tabular-nums">
                  {formatDecimal(m / 60)}
                </td>
                <td className="py-2 pl-4 text-muted-foreground">
                  {m === 6
                    ? "One tenth of an hour"
                    : m === 15
                      ? "Quarter hour"
                      : m === 30
                        ? "Half hour"
                        : m === 45
                          ? "Three quarters"
                          : m === 12
                            ? "One fifth of an hour"
                            : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TimeToDecimalCalculatorPage() {
  return (
    <ToolPage
      slug="time-to-decimal-calculator"
      kicker="Timesheets · Free tool"
      title={"Time to Decimal\nCalculator"}
      lead="Convert hours and minutes into decimal hours, or decimal hours back into time. Add a whole timesheet, apply your employer's rounding rule, and read the total off the bottom."
      methodsHeading="Two directions, one rounding rule"
      methodsLead="An hours to decimal calculator, a decimal hour calculator and a decimal to time calculator are all the same tool pointed in different directions. What changes the answer is the rounding your payroll applies."
      methods={[
        {
          n: "I",
          title: "Time → decimal",
          body: "Type 7:20, 7h20 or 450m and get 7.33. This is the direction payroll systems and timesheet software expect, because decimal hours multiply cleanly by an hourly rate.",
        },
        {
          n: "II",
          title: "Decimal → time",
          body: "Type 7.33 and get 7:20. Useful when a system reports decimal hours and you need to know what that means in real minutes before signing a timesheet.",
        },
        {
          n: "III",
          title: "Payroll rounding",
          body: "Round every entry to the nearest minute, tenth of an hour, quarter hour or half hour. Each row is rounded before the total is added up, which is how employers actually do it.",
        },
      ]}
      essay={{
        heading: "Why 7:20 is not 7.20",
        paragraphs: [
          "This is the mistake the conversion exists to prevent. Written on a clock, 7:20 means seven hours and twenty minutes. Typed into a spreadsheet as 7.20 it means seven hours and twelve minutes, because a decimal fraction of an hour is out of a hundred, not out of sixty. Twenty minutes of an hour is 0.333, so the correct decimal is 7.33.",
          "Eight minutes a day sounds trivial. Over a five-day week it is forty minutes, and over a year it is roughly the same as working an extra week for nothing — or being paid for one you did not work, depending on which way the error runs. That is why timesheet systems insist on decimal hours and why converting by hand is worth double-checking.",
        ],
      }}
      faqs={FAQS}
      extra={<ReferenceTable />}
    >
      <TimeDecimalCalculator />
    </ToolPage>
  );
}
