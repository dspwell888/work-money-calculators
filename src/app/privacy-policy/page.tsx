import type { Metadata } from "next";

import { ProsePage } from "@/components/prose-page";
import { ADS_ENABLED, LEGAL_UPDATED, OPERATOR, PLAUSIBLE_DOMAIN } from "@/lib/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What this site collects, what it does not, and who to contact about it. Calculations run in your browser and are never transmitted.",
  alternates: { canonical: "/privacy-policy/" },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  const contact = OPERATOR.email || "the address on the contact page";

  return (
    <ProsePage
      kicker="Legal"
      title="Privacy Policy"
      lead="The short version: the calculators run entirely in your browser, and the numbers you type are never sent anywhere."
      updated={LEGAL_UPDATED}
      sections={[
        {
          heading: "Who runs this site",
          paragraphs: [
            `${SITE_NAME} is operated by ${OPERATOR.name}. Questions about this policy, or requests about your data, go to ${contact}.`,
          ],
        },
        {
          heading: "What the calculators do with your figures",
          paragraphs: [
            "Nothing leaves your device. Every calculator on this site is JavaScript running in your browser. Salaries, hourly rates, timesheet entries, commission figures and any deduction rate you type are held in the page's memory and discarded when you close the tab.",
            "There is no account system, no database, and no server that receives your inputs. We could not look up what you typed even if we wanted to.",
          ],
        },
        {
          heading: "Share links",
          paragraphs: [
            "When you use a calculator, the values are also written into the address bar so the page can be bookmarked or shared. That URL is generated in your browser. If you choose to send it to someone, the figures travel inside the link — treat a share link with your salary in it the way you would treat any message containing that information.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            ADS_ENABLED
              ? "This site itself sets no cookies. Google, as a third-party advertising vendor, uses cookies to serve ads. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this and other sites."
              : "This site sets no cookies at all, and no advertising is currently served.",
            ADS_ENABLED
              ? "You can opt out of personalised advertising at google.com/settings/ads, and out of third-party vendor cookies at aboutads.info. In regions requiring consent, ads are only loaded after you accept, and you can change that choice at any time using the cookie banner."
              : "If advertising is introduced later, this policy will be updated before any ad code is loaded, and consent will be requested where it is required.",
          ],
        },
        {
          heading: "Analytics",
          paragraphs: [
            PLAUSIBLE_DOMAIN
              ? "Aggregate traffic statistics are collected using Plausible Analytics, which is cookie-free and does not collect or store personal data or track visitors across sites. It records page views, referrer, and coarse country and device type. It never receives the values you type into a calculator."
              : "No analytics are currently running on this site beyond the standard request logs kept by the hosting provider.",
            "Google Search Console may be used to see which search queries lead to this site. That data is aggregated by Google and does not identify individual visitors.",
          ],
        },
        {
          heading: "What we never collect",
          bullets: [
            "The numbers you enter into any calculator.",
            "Names, email addresses, or payment details — there is nothing here to sign up for or buy.",
            "Any special category data, and nothing at all from anyone we know to be under 16.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "Because no personal data is stored, there is usually nothing to access, correct, or delete. If you believe we hold something about you, write to " +
              contact +
              " and we will respond within 30 days. If you are in the UK or EU you also have the right to complain to your national data protection authority.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "Any material change to this policy will be reflected in the date at the top of this page. If advertising or analytics are introduced, this page will be updated before those scripts are loaded.",
          ],
        },
      ]}
    />
  );
}
