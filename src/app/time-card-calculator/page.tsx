import type { Metadata } from "next";

import { TimeCardCalculator } from "@/components/time-card-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/time-card-calculator/";

export const metadata: Metadata = {
  title: "Time Card Calculator — Weekly and Biweekly, With Lunch Breaks",
  description:
    "A free time card calculator with lunch breaks. Enter clock in and clock out for each day, deduct unpaid breaks, handle night shifts that cross midnight, and get weekly and biweekly totals with overtime.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Time Card Calculator",
    description:
      "Clock in and out, deduct breaks, handle night shifts, and total by week with overtime.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I calculate hours on a time card with a lunch break?",
    a: "Work out the span from clock in to clock out, then subtract the unpaid break. A 09:00 to 17:30 day with a 30-minute lunch is eight hours, not eight and a half. Enter the break in minutes on each row and this timesheet calculator with breaks does the subtraction per day.",
  },
  {
    q: "How does the calculator handle a night shift?",
    a: "When the clock-out time is at or before the clock-in time, the shift is treated as ending the next day — 22:00 to 06:00 is eight hours. Those rows are marked with a moon icon so you can see the assumption being made rather than wondering why a number looks odd.",
  },
  {
    q: "Is overtime worked out per week or per pay period?",
    a: "Per week, always, and this matters on a biweekly time card. Fifty hours one week and thirty the next is ten hours of overtime, not none — averaging the two weeks to forty would quietly cost you those hours. The results are broken out week by week so you can see it happening.",
  },
  {
    q: "Why does the week start day change my overtime?",
    a: "Because it decides which week a shift falls in. A Sunday shift joins the previous week under a Monday-start convention and the following one under a Sunday start, which can push a week over the overtime threshold or pull it under. Set it to match your employer's workweek, not your calendar's.",
  },
  {
    q: "Can I use this as a biweekly timesheet calculator?",
    a: "Yes. Add up to fourteen days and the calculator groups them into weeks automatically, showing a subtotal for each and a combined total at the bottom. That is the correct structure for a biweekly card, because the pay period and the overtime period are not the same thing. It works as an employee time card calculator for a single person — there is no multi-employee roster, since nothing is stored anywhere.",
  },
  {
    q: "What if my break is longer than my shift?",
    a: "The day is clamped to zero rather than going negative, and the row is flagged. It almost always means a typo in one of the times — most often an am/pm mix-up — and flagging it is more useful than silently subtracting from your week.",
  },
  {
    q: "Does this calculate my pay after deductions?",
    a: "No. The gross figure is hours multiplied by your rate, with overtime at the multiplier you set. What comes off depends on rules that vary by country and personal circumstance, and this site does not calculate tax of any kind.",
  },
];

export default function TimeCardCalculatorPage() {
  return (
    <ToolPage
      slug="time-card-calculator"
      kicker="Timesheets · Free tool"
      title={"Time Card\nCalculator"}
      lead="Enter clock in and clock out for each day, deduct unpaid breaks, and get weekly and biweekly totals — with night shifts and weekly overtime handled properly."
      methodsHeading="Three things most time card calculators get wrong"
      methodsLead="An hours calculator with lunch is easy. A biweekly time card calculator that handles night shifts and weekly overtime correctly is where they usually fall down."
      methods={[
        {
          n: "I",
          title: "Breaks come off each day",
          body: "Unpaid break minutes are subtracted per row, not from the weekly total. A break longer than the shift is flagged rather than silently subtracted.",
        },
        {
          n: "II",
          title: "Night shifts cross midnight",
          body: "An out time at or before the in time means the next day. 22:00 to 06:00 is eight hours, and the row is marked so the assumption is visible.",
        },
        {
          n: "III",
          title: "Overtime is weekly",
          body: "A two-week card is two weeks. 50 hours then 30 is ten hours of overtime — averaging the card to forty would lose them.",
        },
      ]}
      essay={{
        heading: "Why the week boundary is worth getting right",
        paragraphs: [
          "Overtime is almost universally calculated per workweek rather than per pay period, and a biweekly card contains two of them. That distinction is invisible until the two weeks are uneven, at which point it decides whether ten hours are paid at the plain rate or at a premium. On a $22 base that is over a hundred dollars on a single card.",
          "The second thing it decides is which week a weekend shift belongs to. Employers define their workweek in the contract or handbook — Sunday to Saturday is common in the US, Monday to Sunday elsewhere — and it is not always the one your calendar shows. Setting it correctly here takes a second and occasionally changes the total.",
        ],
      }}
      faqs={FAQS}
    >
      <TimeCardCalculator />
    </ToolPage>
  );
}
