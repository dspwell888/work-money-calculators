import type { Metadata } from "next";

import { ToolPage } from "@/components/tool-page";
import { WorkScheduleMaker } from "@/components/work-schedule-maker";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/work-schedule-maker/";

export const metadata: Metadata = {
  title: "Work Schedule Maker — Free Employee Shift Rota with Hours and Cost",
  description:
    "A free work schedule maker. Build a one or two week employee schedule from your own shift library, see hours and wage cost per person, catch overtime, and export the rota to CSV.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Work Schedule Maker",
    description:
      "Build a shift rota, see hours and cost per person, and export to CSV.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I make a work schedule for my team?",
    a: "Define the shifts you actually run — an early, a late, a night — then assign one to each person for each day. This employee schedule maker totals the hours and wage cost as you go, so you can see what a rota costs before you publish it rather than after payroll runs.",
  },
  {
    q: "Does it warn me about overtime?",
    a: "Any week over your threshold shows the overtime hours next to that person's total, and the pay column prices them at your multiplier. Overtime is counted per seven days from the start date, so on a fortnightly rota a heavy week followed by a light one still shows up — averaging the two would hide it.",
  },
  {
    q: "How do night shifts work?",
    a: "A shift whose end time is at or before its start is treated as ending the next day, and the shift library marks it with a moon icon. An 23:00 to 07:00 night with an hour of unpaid break is seven paid hours, not minus sixteen.",
  },
  {
    q: "Can I export the rota?",
    a: "Yes, as CSV — one row per person, one column per day, with a totals row at the bottom. It opens directly in Excel, Numbers, or Google Sheets, so you can print it, mail it, or paste it into whatever your team already uses.",
  },
  {
    q: "Is my schedule saved anywhere?",
    a: "No. Nothing is stored on any server and there is no account. The whole rota lives in the address bar, which is why Copy share link works: send that URL to a colleague and they open the same schedule. Bookmark it to keep a rota, or export the CSV.",
  },
  {
    q: "How many people and days can I schedule?",
    a: "Up to twelve people across one or two weeks, with a library of up to six shifts. That covers a single team or a department rota — a work timetable for one department rather than a company. Beyond that you want scheduling software with availability, time-off requests, and shift swaps: this is a shift schedule maker, not a workforce management system.",
  },
  {
    q: "Can I set different pay rates per person?",
    a: "Yes, each row has its own hourly rate, so the cost figure reflects who is actually working rather than an average. That matters most when you are choosing between two people for the same shift, which is exactly when a rota decision becomes a budget decision.",
  },
  {
    q: "Does the cost include taxes or employer contributions?",
    a: "No. The cost shown is gross wages only. Employer-side charges vary by country and are not calculated anywhere on this site — the employee cost calculator applies a percentage you supply if you need the fully loaded figure.",
  },
];

export default function WorkScheduleMakerPage() {
  return (
    <ToolPage
      slug="work-schedule-maker"
      kicker="Rostering · Free tool"
      title={"Work Schedule\nMaker"}
      lead="Build a one or two week rota from your own shift library. Hours, overtime, and wage cost update per person as you assign, and the whole schedule exports to CSV."
      methodsHeading="A rota is a budget you can see"
      methodsLead="Most free schedule makers give you a grid and stop. The useful part is what the grid costs — which person, on which shift, tips a week into overtime."
      methods={[
        {
          n: "I",
          title: "Your shifts, not ours",
          body: "Define up to six shifts with real start and end times and unpaid breaks. Night shifts crossing midnight are handled and flagged.",
        },
        {
          n: "II",
          title: "Assign and watch the cost",
          body: "Each person carries their own hourly rate, so hours and wage cost update per row as you fill the grid. Overtime appears the moment a week crosses the threshold.",
        },
        {
          n: "III",
          title: "Export and share",
          body: "Download a CSV that opens in any spreadsheet, or copy a share link that carries the entire rota. Nothing is stored anywhere.",
        },
      ]}
      essay={{
        heading: "The expensive shift is the one nobody priced",
        paragraphs: [
          "Rotas are usually built for coverage and costed afterwards, if at all. That order is why the same schedule can come in over budget month after month without anyone being able to say which decision did it — by the time payroll runs, the individual choices have blurred into a single total.",
          "Putting the rate next to the name changes that. A sixth shift for someone already on thirty-seven and a half hours is not the same cost as giving it to someone on twenty-two, and the difference is visible while you are still deciding. The coverage row along the bottom is the other half of the same judgement: it shows where you are thin before the week starts rather than on the morning it goes wrong.",
        ],
      }}
      faqs={FAQS}
    >
      <WorkScheduleMaker />
    </ToolPage>
  );
}
