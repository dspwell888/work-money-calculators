import type { Metadata } from "next";

import { NannyPayCalculator } from "@/components/nanny-pay-calculator";
import { ToolPage } from "@/components/tool-page";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/nanny-pay-calculator/";

export const metadata: Metadata = {
  title: "Nanny Pay Calculator — Hourly, Overtime and Extra Children",
  description:
    "A free nanny pay calculator and babysitter pay calculator. Work out what is owed from the hourly rate, hours worked, overtime, a per-child uplift, and any extras. Gross figures only.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Nanny Pay Calculator",
    description:
      "Hourly rate, overtime, and a per-child uplift, totalled into what you owe.",
    url: `${SITE_URL}${PATH}`,
    siteName: SITE_NAME,
    type: "website",
  },
};

const FAQS = [
  {
    q: "How do I work out what to pay a nanny?",
    a: "Multiply the agreed hourly rate by the hours worked, add any overtime at the agreed multiplier, add an uplift if more than one child is being cared for, then add flat extras like travel or a late finish. The calculator does all four steps and shows each one, so both sides can check the same figures.",
  },
  {
    q: "Should extra children cost more per hour?",
    a: "Usually yes, and a per-hour uplift is the common arrangement — often a couple of dollars an hour for each child beyond the first. Agreeing it in advance avoids the most frequent argument in this kind of work, which is what happens when a friend's child stays for the afternoon.",
  },
  {
    q: "Does overtime apply to the base rate or the uplifted rate?",
    a: "To the uplifted rate, and this calculator does it that way. If the sitter is being paid $22 an hour because there are two children, then overtime at time and a half is $33 an hour, not $30. The rate that gets multiplied is the rate actually being worked.",
  },
  {
    q: "What is a fair babysitter rate?",
    a: "It depends entirely on where you live, how many children, their ages, and whether anything beyond supervision is expected. No calculator can tell you the going rate in your area — ask locally. What this tool does is turn whatever rate you agree into an unambiguous total, which is the part that causes friction.",
  },
  {
    q: "How should I handle a late finish?",
    a: "Either as overtime hours at a multiplier, or as a flat extra. Both are supported above. Agreeing which one applies before the evening starts is worth more than either number, because the disagreement is almost never about the amount — it is about whether the arrangement had been agreed at all.",
  },
  {
    q: "Does this calculate nanny tax or deductions?",
    a: "No, deliberately. Employing someone in your home has its own rules that vary by country and by how much you pay, and getting them wrong has consequences a calculator cannot warn you about. Every figure here is the gross amount agreed between you. For anything to do with withholding or filing, speak to an accountant.",
  },
  {
    q: "Can I use this for a whole week or just one evening?",
    a: "Either. Enter the hours for whatever period you are settling — a single evening, a week, or a month. The average hourly figure at the bottom is useful across longer periods, where overtime and uplifts can make the effective rate quite different from the headline one.",
  },
];

export default function NannyPayCalculatorPage() {
  return (
    <ToolPage
      slug="nanny-pay-calculator"
      kicker="Childcare · Free tool"
      title={"Nanny Pay\nCalculator"}
      lead="Work out exactly what is owed: hourly rate, hours worked, overtime, an uplift for extra children, and any extras — totalled so both sides are looking at the same number."
      methodsHeading="Four things that change the total"
      methodsLead="A nanny pay calculator and a babysitter pay calculator do the same arithmetic. What causes disagreements is not the rate, it is the three things people forget to agree on before the evening starts."
      methods={[
        {
          n: "I",
          title: "Rate and hours",
          body: "The agreed hourly rate multiplied by hours worked. Everything else builds on this, so it is worth writing down somewhere before the first session rather than after.",
        },
        {
          n: "II",
          title: "Extra children",
          body: "An uplift per hour for each child beyond the first. It raises the working rate, which means overtime is calculated on the higher figure — as it should be.",
        },
        {
          n: "III",
          title: "Overtime and extras",
          body: "A late finish handled either as overtime at a multiplier or as a flat extra, plus travel or a holiday bonus. Both routes are shown separately in the total.",
        },
      ]}
      essay={{
        heading: "Agree the edge cases, not just the rate",
        paragraphs: [
          "Almost every dispute in domestic childcare is about a case nobody discussed: the evening that ran two hours late, the friend's child who stayed for dinner, the bank holiday. The hourly rate is the easy part and it is usually settled in the first conversation. The edge cases are what get settled awkwardly, months later, over a figure neither side can reconstruct.",
          "The practical use of a calculator like this is not the arithmetic — it is having one screen both people can look at, with the late hours and the second child broken out as their own lines. Send the summary after the session and the arrangement stays explicit, which is worth considerably more than the couple of minutes it takes.",
        ],
      }}
      faqs={FAQS}
    >
      <NannyPayCalculator />
    </ToolPage>
  );
}
