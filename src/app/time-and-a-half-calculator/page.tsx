import type { Metadata } from "next";

import { OvertimeCalculator } from "@/components/overtime-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/time-and-a-half-calculator/";

export const metadata: Metadata = {
  title: "Time and a Half Calculator — Overtime Pay at 1.5x and 2x",
  description:
    "A free overtime pay calculator. Work out overtime at time and a half, double time, or any multiplier, split the week across two rates, and see the overtime rate, the gross total, and the blended hourly rate.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Time and a Half Calculator",
    description:
      "An overtime pay calculator for 1.5x, 2x, or a custom multiplier, including split tiers above a weekly threshold.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I calculate time and a half?",
    a: "Multiply your base hourly rate by 1.5, then multiply that by the overtime hours. On $22 an hour, time and a half is $33 an hour, so eight overtime hours come to $264 on top of your regular pay. The calculator above shows both the overtime rate and the resulting pay so you can check each step.",
  },
  {
    q: "What is time and a half for $20 an hour?",
    a: "$30 an hour. The quick way to do it in your head is to take half the rate and add it on: half of $20 is $10, so time and a half is $30. Double time on the same rate is $40.",
  },
  {
    q: "Is overtime calculated on my base rate or my average rate?",
    a: "The multiplier applies to your base hourly rate, not to a rate that already includes overtime. That is why the calculator shows a separate blended rate: it tells you what the whole week averaged out to per hour, which is useful for comparison but is never the figure the multiplier is applied to.",
  },
  {
    q: "What if part of my week is time and a half and part is double time?",
    a: "Use Add a rate. Many agreements pay 1.5x for the first block of overtime and 2x beyond a threshold, or 2x on Sundays and public holidays regardless of the weekly total. Each rate is worked out separately and the results are added, which is exactly how the payslip does it.",
  },
  {
    q: "When does overtime have to be paid?",
    a: "That depends on your country, your contract, and often your job classification, and the rules change. This calculator works out what a given rate and multiplier produce — it does not decide whether you are entitled to them. Check your contract or the relevant labour authority for entitlement.",
  },
  {
    q: "What is the blended rate for?",
    a: "It is the total gross divided by the total hours: what the week averaged per hour once overtime is included. It is a useful sanity check when comparing a job with heavy overtime against one with a higher base rate and none, because the headline rates alone will mislead you.",
  },
  {
    q: "Is this an overtime deduction calculator?",
    a: "Not in the tax sense, and deliberately so. An overtime deduction calculator usually means working out what is taken off an overtime payment, and that depends on rules that vary by country and by your own circumstances. This tool shows gross overtime — the rate, the pay per tier, and the weekly total — and stops there. If you want a rough net figure, apply the effective deduction rate from your own payslip to the gross number yourself.",
  },
  {
    q: "What does a qualified overtime calculator mean?",
    a: "Qualified overtime normally means hours that qualify for a premium rate, whether under your agreement or under the law that covers you. Whether a given hour qualifies is a question about your contract and jurisdiction, not arithmetic, so this calculator does not try to decide it. What it does is price the hours once you know which ones qualify: enter them, pick the multiplier they attract, and it returns the overtime rate and the pay.",
  },
  {
    q: "Does this show my pay after tax?",
    a: "No. Every figure here is gross. Overtime is often withheld at a different rate than regular pay, which is why an overtime cheque frequently looks smaller than expected, but the rules for that are country and situation specific and this tool deliberately does not guess at them.",
  },
];

export default function TimeAndAHalfCalculatorPage() {
  return (
    <ToolPage
      slug="time-and-a-half-calculator"
      kicker="Overtime · Free tool"
      title={"Time and a Half\nCalculator"}
      lead="Work out what overtime is actually worth. Set your base rate and hours, pick a multiplier, and split the week across two rates when the agreement changes part way through."
      methodsHeading="Overtime, one rate at a time"
      methodsLead="Time and a half is a multiplier on your base rate, not a separate rate of its own. Once you see it that way, this overtime pay calculator is really an overtime rate calculator with the hours filled in — and the arithmetic stops being confusing, including when a week splits across two multipliers."
      methods={[
        {
          n: "I",
          title: "Time and a half",
          body: "1.5x the base rate. The standard overtime premium in most agreements, usually for hours beyond the contracted week. On $22 that is $33 an hour.",
        },
        {
          n: "II",
          title: "Double time",
          body: "2x the base rate. Common for public holidays, Sundays, and hours beyond a second threshold. Some agreements go further still, which is why the multiplier field accepts any number.",
        },
        {
          n: "III",
          title: "Split weeks",
          body: "Add a second or third rate when the week is not uniform: some hours at 1.5x, the rest at 2x. Each block is priced separately and totalled, as payroll does it.",
        },
      ]}
      essay={{
        heading: "The mistake that costs the most",
        paragraphs: [
          "The common error is applying the multiplier to the wrong number — to a rate that already includes a shift premium, or to an average that already has overtime baked into it. Overtime multiplies your base rate. If you compound it against an already-inflated figure the result looks generous and will not match the payslip, and if you apply it to a rate that omits a premium you are owed, the result is quietly too low.",
          "The way to calculate overtime without getting lost is to do it in two steps rather than one. First find the overtime rate — base rate times multiplier. Then multiply that rate by the overtime hours. Doing both at once in a single expression is where sign errors and misplaced multipliers creep in, and it is why the table above shows the rate on its own line before it shows the pay.",
          "The second trap is comparing jobs by base rate alone. A role at $22 an hour with eight hours of time and a half every week pays more than a role at $25 with none, and the blended rate in the table above is the number that makes that visible. It is also the number worth checking before agreeing to a schedule that relies on overtime continuing, because overtime is the first thing to disappear when work slows down.",
        ],
      }}
      faqs={FAQS}
    >
      <OvertimeCalculator />
    </ToolPage>
  );
}
