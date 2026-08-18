import type { Metadata } from "next";

import { ShiftDifferentialCalculator } from "@/components/shift-differential-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/shift-differential-calculator/";

export const metadata: Metadata = {
  title: "Shift Differential Calculator — Night, Evening and Weekend Premiums",
  description:
    "A free shift differential calculator. Set your base rate, add a percentage or flat premium for each shift, and see the rate per shift, the total premium, and your blended hourly rate.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Shift Differential Calculator",
    description:
      "Base rate plus a percentage or flat premium per shift, with the blended rate.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "What is a shift differential?",
    a: "A premium paid for working an unsociable shift — nights, evenings, weekends, or public holidays. It is added to your base hourly rate for the hours falling in that shift, and it is separate from overtime: you can be paid a differential without working a single extra hour.",
  },
  {
    q: "How do I calculate shift differential pay?",
    a: "Work out the premium per hour, add it to your base rate, then multiply by the hours in that shift. On $20 an hour with a 10% evening differential, evening hours pay $22. Do it once per shift type and add the results, which is what the table above does.",
  },
  {
    q: "Is a differential a percentage or a flat amount?",
    a: "Both exist, and which one you are on matters more than people expect. A 10% differential on $20 is $2 an hour; a flat $2 differential is the same thing at that rate but worth far less proportionally if your base rate rises to $35. Switch between the two modes above to see the gap at your own rate.",
  },
  {
    q: "Does overtime get calculated on the differential rate?",
    a: "Often it does, because many agreements base overtime on the rate actually being worked rather than the plain base rate. This calculator prices the shifts themselves — for overtime on top, take the shift rate it produces and use the time and a half calculator.",
  },
  {
    q: "What is the blended rate for?",
    a: "It is the total divided by all the hours: what your whole roster averages per hour once the premiums are in. It is the number to compare against a day-shift job with a higher base rate and no differential, because comparing base rates alone will tell you the wrong thing.",
  },
  {
    q: "Am I entitled to a shift differential?",
    a: "That depends on your contract, your employer, and sometimes your industry or jurisdiction — in many places it is entirely a matter of agreement rather than law. This calculator works out what a differential is worth once you know you have one. Check your contract or staff handbook for whether you do.",
  },
  {
    q: "Does this show pay after deductions?",
    a: "No. Every figure here is gross. What comes off depends on rules that vary by country and personal circumstance, and this site does not calculate tax of any kind.",
  },
];

export default function ShiftDifferentialCalculatorPage() {
  return (
    <ToolPage
      slug="shift-differential-calculator"
      kicker="Shift work · Free tool"
      title={"Shift Differential\nCalculator"}
      lead="Set your base rate, add the premium each shift attracts as a percentage or a flat amount, and see the rate per shift, the total premium, and what the whole roster averages per hour."
      methodsHeading="Percentage or flat, and why it matters"
      methodsLead="The same differential written two ways produces very different money at different base rates. Getting the form right is as important as getting the number right."
      methods={[
        {
          n: "I",
          title: "Percentage premium",
          body: "A share of your base rate, so it scales with pay rises. Ten percent on $20 is $2 an hour; on $35 it is $3.50. Common in healthcare and unionised workplaces.",
        },
        {
          n: "II",
          title: "Flat premium",
          body: "A fixed amount per hour regardless of base rate. Simple to state, but it quietly shrinks in relative terms every time your base rate goes up.",
        },
        {
          n: "III",
          title: "The blended rate",
          body: "Total pay over total hours. This is the figure that makes a night-heavy roster comparable with a day job on a higher base rate.",
        },
      ]}
      essay={{
        heading: "A flat differential erodes",
        paragraphs: [
          "A flat differential looks identical to a percentage one on the day it is agreed and diverges every year afterwards. Two dollars an hour on a base of $20 is a 10% premium. After a few raises, on a base of $30, that same two dollars is a 6.7% premium — the inconvenience of working nights has not changed, but what you are paid for it has fallen by a third in real terms.",
          "This is worth knowing before a negotiation rather than after. Switching the mode above, with your own base rate in the field, shows the two forms side by side; if you are on a flat differential that has not moved in several years, the gap is the argument.",
        ],
      }}
      faqs={FAQS}
    >
      <ShiftDifferentialCalculator />
    </ToolPage>
  );
}
