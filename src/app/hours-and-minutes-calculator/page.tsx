import type { Metadata } from "next";

import { HoursMinutesCalculator } from "@/components/hours-minutes-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/hours-and-minutes-calculator/";

export const metadata: Metadata = {
  title: "Hours and Minutes Calculator — Add and Subtract Times",
  description:
    "A free hours and minutes calculator. Add and subtract times in h:mm, or work out the time between two clocks including overnight, with the running total and the decimal equivalent shown.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Hours and Minutes Calculator",
    description:
      "Add and subtract times in h:mm, or measure the gap between two clock times.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I add hours and minutes together?",
    a: "Add the minutes first, carry every 60 into an hour, then add the hours. 2:45 plus 1:30 is 75 minutes and 3 hours, which carries to 4:15. This hour and minute calculator keeps a running total after each row so you can see where a carry happened rather than trusting a single final number.",
  },
  {
    q: "Why can I not just add 2.45 and 1.30 on a normal calculator?",
    a: "Because minutes go up in sixties and decimals go up in hundreds. Typing 2.45 + 1.30 gives 3.75, which is neither 4:15 nor anything useful. Either convert to decimal properly first — 2:45 is 2.75 — or use a calculator that understands h:mm, which is what this one does.",
  },
  {
    q: "How do I subtract a break from a shift?",
    a: "Add the shift, then set a row to minus and enter the break. 8:00 minus 0:45 is 7:15. You can chain as many additions and subtractions as you need, and the running total updates line by line.",
  },
  {
    q: "How do I work out the time between two clock times?",
    a: "Switch to the second mode and enter both times in 24-hour form. It handles the overnight case: 22:00 to 06:00 is eight hours, not minus sixteen. An end time at or before the start is treated as the next day, the same convention the time card calculator uses.",
  },
  {
    q: "Can the total be negative?",
    a: "Yes, and it is shown as negative rather than clamped to zero. Subtracting a longer duration is a perfectly normal thing to want to do — working out how far short of a target you are, for instance — and hiding the sign would make the answer useless.",
  },
  {
    q: "What formats can I type in?",
    a: "2:45, 2h45, 2 h 45 m, 165m and 2.75 all mean the same thing here. A row that cannot be read is flagged rather than counted as zero, so a typo never quietly changes your total.",
  },
  {
    q: "How do I get the decimal equivalent for a timesheet?",
    a: "It is shown under the total automatically, along with the figure in minutes. If you need a whole timesheet converted rather than a single sum, the time to decimal calculator handles multiple entries with payroll rounding.",
  },
];

export default function HoursAndMinutesCalculatorPage() {
  return (
    <ToolPage
      slug="hours-and-minutes-calculator"
      kicker="Time arithmetic · Free tool"
      title={"Hours and Minutes\nCalculator"}
      lead="Add and subtract times in hours and minutes, or measure the gap between two clock times — overnight included — with the running total shown line by line."
      methodsHeading="Two kinds of time question"
      methodsLead="Both are awkward on an ordinary calculator for the same reason: minutes carry at sixty, and decimal arithmetic carries at a hundred."
      methods={[
        {
          n: "I",
          title: "Add and subtract",
          body: "Chain as many durations as you need, each set to plus or minus. The running total after every row makes a carry visible instead of hiding it in the answer.",
        },
        {
          n: "II",
          title: "Between two clocks",
          body: "Enter a start and an end in 24-hour form. An end at or before the start counts as the next day, so overnight shifts come out right.",
        },
        {
          n: "III",
          title: "Both ways out",
          body: "Every total is given in h:mm, in decimal hours for a timesheet, and in plain minutes. No second conversion step.",
        },
      ]}
      essay={{
        heading: "Where the sixty catches you out",
        paragraphs: [
          "The reason a pocket calculator gets this wrong is that it has no idea the second number after the point means minutes. Adding 2.45 and 1.30 gives 3.75 — a number that looks plausible, is not 4:15, and will pass a quick sanity check because it is roughly the right size. That is what makes it dangerous rather than merely wrong.",
          "The habit worth building is to notice which system you are in before you start. If a figure came off a clock it carries at sixty; if it came off a timesheet it probably carries at a hundred. Converting once, deliberately, at the start is far safer than converting repeatedly in your head and hoping the mistakes cancel out.",
        ],
      }}
      faqs={FAQS}
    >
      <HoursMinutesCalculator />
    </ToolPage>
  );
}
