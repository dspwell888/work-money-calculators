import type { Metadata } from "next";

import { ProsePage } from "@/components/prose-page";
import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms on which these calculators are provided: free, as-is, and not a substitute for advice from your employer, accountant, or payroll department.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <ProsePage
      kicker="Legal"
      title="Terms of Use"
      lead="These are free tools provided as-is. They do arithmetic accurately, but arithmetic is not advice."
      updated={LEGAL_UPDATED}
      sections={[
        {
          heading: "Using the site",
          paragraphs: [
            `${SITE_NAME} is provided free of charge by ${OPERATOR.name}. You may use the calculators for personal or commercial purposes, and you may share links to them, without asking permission.`,
          ],
        },
        {
          heading: "No advice",
          paragraphs: [
            "Nothing here is financial, tax, legal, or employment advice. The calculators apply the arithmetic you ask them to apply to the figures you supply. Whether a raise is fair, whether overtime is owed, whether a commission plan is enforceable, and what tax applies to any of it are questions this site does not answer and does not try to.",
            "Before acting on a number produced here — accepting an offer, disputing a payslip, signing a contract — check it against your actual contract and, where money or rights are at stake, take professional advice.",
          ],
        },
        {
          heading: "Deliberately no tax calculation",
          paragraphs: [
            "These tools do not calculate tax, withholding, or net pay from any tax table. Rates and thresholds vary by country and jurisdiction and change every year, and a wrong figure would cost you real money. Where a take-home estimate is shown, it applies only a percentage you typed in yourself and is labelled as a scenario estimate.",
          ],
        },
        {
          heading: "Accuracy and liability",
          paragraphs: [
            "The calculations are tested, but the site is provided without warranty of any kind. To the fullest extent permitted by law, we accept no liability for any loss arising from use of these tools or reliance on their output. If you find an error, please report it — it will be fixed.",
          ],
        },
        {
          heading: "Availability",
          paragraphs: [
            "The site may change or be withdrawn at any time without notice. Share links are intended to keep working, but no guarantee is made that a link saved today will resolve identically in future.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            OPERATOR.jurisdiction
              ? `These terms are governed by the law of ${OPERATOR.jurisdiction}.`
              : "These terms are governed by the law of the operator's place of establishment.",
          ],
        },
      ]}
    />
  );
}
