import type { Metadata } from "next";

import { BillableHoursCalculator } from "@/components/billable-hours-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/billable-hours-calculator/";

export const metadata: Metadata = {
  title: "Billable Hours Calculator — With Minimum Increments",
  description:
    "A free billable hours calculator. Log each task, round every entry up to your minimum increment — 6, 10, 15 or 30 minutes — and get the billable total and the invoice amount.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Billable Hours Calculator",
    description:
      "Log tasks, apply your minimum billing increment, and get the invoice total.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I calculate billable hours?",
    a: "Log the time each task actually took, round every entry up to your minimum billing increment, convert the total to hours, and multiply by your rate. The rounding happens entry by entry rather than on the total — that ordering is what makes billable hours different from a timesheet, and it is why the two numbers rarely match.",
  },
  {
    q: "What is a minimum billing increment?",
    a: "The smallest unit of time you charge for. Six minutes — a tenth of an hour — is standard in law and accounting; fifteen minutes is common in consulting and trades. A two-minute phone call bills as six minutes on a tenth-hour increment and as fifteen on a quarter-hour one.",
  },
  {
    q: "Why does the billed total come out higher than the time I worked?",
    a: "Because every entry rounds up. A day of short tasks generates a lot of rounding: ten five-minute calls are fifty minutes of work but bill as two and a half hours on a fifteen-minute increment. The calculator shows the uplift as its own line so you can see exactly how much of the invoice comes from the rounding rule rather than the clock.",
  },
  {
    q: "Is rounding up ethical?",
    a: "It is the industry norm and it is usually written into the engagement letter, but it only stays defensible when the increment is disclosed and the entries are honest. The reason this calculator shows worked time and billed time side by side is so you can see the gap yourself, and decide whether a particular sheet is one you would be comfortable defending.",
  },
  {
    q: "Should I use six-minute or fifteen-minute increments?",
    a: "Six minutes is fairer to the client and standard where clients scrutinise bills. Fifteen suits work that comes in longer blocks and is simpler to record. Run the same sheet through both settings above: on fragmented days the difference is large, on days of long focused work it almost vanishes.",
  },
  {
    q: "What time formats can I type?",
    a: "The duration field accepts 0:25, 25m, 1.5, and 1h30. A row it cannot read is flagged rather than silently counted as zero, so a typo never quietly shrinks your invoice.",
  },
  {
    q: "Does this store my time entries?",
    a: "No. Everything runs in your browser and nothing is saved anywhere. If you want to keep a sheet, use Copy share link — the entries travel inside the URL, so bookmark it or paste it somewhere you control.",
  },
];

export default function BillableHoursCalculatorPage() {
  return (
    <ToolPage
      slug="billable-hours-calculator"
      kicker="Professional fees · Free tool"
      title={"Billable Hours\nCalculator"}
      lead="Log each task, apply the minimum increment you actually bill in, and get the billable total and the invoice amount — with the rounding uplift shown separately."
      methodsHeading="Why the increment matters more than the rate"
      methodsLead="On fragmented work the billing increment moves the invoice more than a rate change would. A day of short tasks can bill 30% above the clock on a quarter-hour increment and almost nothing above it on a tenth-hour one."
      methods={[
        {
          n: "I",
          title: "Log the real time",
          body: "Enter what each task actually took, in whatever format you think in: 0:25, 25m, 1.5, or 1h30. Name the tasks and the summary reads like a draft invoice.",
        },
        {
          n: "II",
          title: "Round up, entry by entry",
          body: "Each entry rounds up to your increment on its own — 6, 10, 15 or 30 minutes. Rounding the total instead would give a different, lower number, which is not how billing works.",
        },
        {
          n: "III",
          title: "See the uplift",
          body: "Worked hours, billed hours, and the difference between them are all shown. That difference is the part of your invoice created by the rule rather than the work.",
        },
      ]}
      essay={{
        heading: "Fragmentation is what costs clients money",
        paragraphs: [
          "The cost of a billing increment falls entirely on interruption. A four-hour uninterrupted block bills as four hours on any increment. Those same four hours split into sixteen fifteen-minute tasks bill as four hours on a tenth-hour increment and as four hours on a quarter-hour one too — but sixteen five-minute tasks bill as 1.6 hours against 4 hours, a difference of a factor of two and a half.",
          "That is why the interesting number in the table above is the uplift line rather than the total. If it is close to zero your increment is barely affecting the bill. If it is a meaningful fraction of the invoice, the increment is doing more work than your rate is, and it is worth being able to explain it before a client asks.",
        ],
      }}
      faqs={FAQS}
    >
      <BillableHoursCalculator />
    </ToolPage>
  );
}
