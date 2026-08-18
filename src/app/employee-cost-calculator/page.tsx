import type { Metadata } from "next";

import { EmployeeCostCalculator } from "@/components/employee-cost-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/employee-cost-calculator/";

export const metadata: Metadata = {
  title: "Employee Cost Calculator — The True Cost of an Employee",
  description:
    "A free employee cost calculator. Add employer charges and benefits to a base salary to see the true cost of an employee, the multiple of salary, and the cost per productive hour.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Employee Cost Calculator",
    description:
      "Base salary plus employer charges and benefits: the true annual cost and the multiple.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "What is the true cost of an employee?",
    a: "Base salary plus everything the employer pays on top: statutory employer charges, benefits, and any recurring costs attached to the role. A useful rule of thumb is 1.15 to 1.4 times salary, but the multiple depends almost entirely on your benefits package — which is why this true cost of employee calculator asks you to enter yours rather than assuming one.",
  },
  {
    q: "Why does this not include tax rates?",
    a: "Because employer-side charges differ by country, by headcount, sometimes by state or region, and they change every year. A built-in rate would be wrong for most visitors and would go stale annually. The percentage field is yours to fill from your own payroll reports or your accountant.",
  },
  {
    q: "What is the multiple, and what is a normal one?",
    a: "The recurring annual cost divided by base salary. Somewhere between 1.15 and 1.4 is common. A rich benefits package or high statutory charges push it up; a lean package with low charges keeps it near the bottom. The figure is most useful as a planning shortcut once you have calculated it properly once.",
  },
  {
    q: "Should recruitment costs be included?",
    a: "Put them in the one-off field rather than the recurring one. Recruitment fees, equipment, and onboarding are real first-year costs but they do not repeat, so folding them into an ongoing budget overstates every year after the first. The calculator keeps the two figures apart for exactly this reason.",
  },
  {
    q: "What is cost per productive hour for?",
    a: "It is the number to use when pricing work or deciding whether to hire versus contract. Take paid hours and subtract holiday, training, and admin to get productive hours — often nearer 1,700 or 1,800 than 2,080. Dividing the true cost by that figure gives what an hour of actual output costs you.",
  },
  {
    q: "How does this compare to a contractor's rate?",
    a: "Compare the cost per productive hour here against a contractor's hourly rate, not against a salary. That is the like-for-like comparison, and it usually narrows the gap considerably — a contractor charging twice the employee's hourly salary can still be cheaper once benefits, charges, and unproductive hours are counted.",
  },
  {
    q: "Does this work for part-time employees?",
    a: "Yes, if you enter the part-time salary and the benefits actually provided. Be careful with benefits that do not scale — health cover is often the same cost whatever the hours, which raises the multiple sharply for part-time roles and is worth seeing explicitly.",
  },
];

export default function EmployeeCostCalculatorPage() {
  return (
    <ToolPage
      slug="employee-cost-calculator"
      kicker="Hiring · Free tool"
      title={"Employee Cost\nCalculator"}
      lead="See what a hire actually costs: base salary plus employer charges and benefits, expressed as an annual total, a multiple of salary, and a cost per productive hour."
      methodsHeading="Salary is the smaller half of the question"
      methodsLead="An employee cost calculator is only useful if the inputs are yours. This one asks for your employer charge percentage and your benefits rather than assuming a country or a year."
      methods={[
        {
          n: "I",
          title: "Charges on the salary",
          body: "Employer-side contributions as a percentage you supply. Nothing is built in, because it would be wrong for most people and stale within a year.",
        },
        {
          n: "II",
          title: "Benefits",
          body: "Health cover, pension, and anything else with an annual price. List them separately so you can see which ones are actually moving the multiple.",
        },
        {
          n: "III",
          title: "Recurring versus first year",
          body: "Recruitment and equipment are real but do not repeat. They are totalled apart from the recurring figure you budget with every year.",
        },
      ]}
      essay={{
        heading: "Budget with the recurring number",
        paragraphs: [
          "The two figures this calculator produces get confused constantly. The first-year total includes recruitment fees and equipment, which makes it the right number for approving a hire. The recurring total excludes them, which makes it the right number for every year after — and for deciding whether the role pays for itself.",
          "Using the first-year figure as an ongoing budget line inflates a team's cost permanently and makes hiring look worse than it is. Using the recurring figure to approve a hire does the opposite and leaves a hole in the first year. Both numbers are shown because both are needed, at different moments.",
        ],
      }}
      faqs={FAQS}
    >
      <EmployeeCostCalculator />
    </ToolPage>
  );
}
