/**
 * Operator identity and the ad/analytics switches.
 *
 * A privacy policy has to name who is responsible and how to reach them, so
 * these are real values, not placeholders — they must be filled in before the
 * site is published. `npm run build` warns when they still hold the default.
 */
export const OPERATOR = {
  /** Trading name shown on the legal pages. */
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME ?? "Work & Money Calculators",
  /** Contact address. Required by AdSense review and by most privacy laws. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  /** Jurisdiction whose law governs the terms. */
  jurisdiction: process.env.NEXT_PUBLIC_JURISDICTION ?? "",
};

/** Set to your ca-pub-… id to switch ads on. Unset means no ad code at all. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/** Plausible works without cookies, so it needs no consent gate. */
export const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";

export const ADS_ENABLED = ADSENSE_CLIENT !== "";

/** Last substantive edit to the policy text, shown on the legal pages. */
export const LEGAL_UPDATED = "2026-08-06";

/**
 * Who is answerable for the figures on this site.
 *
 * Deliberately modest: no titles, no credentials, no invented review board.
 * The site does arithmetic and says so. Claiming a qualification nobody holds
 * would be worse than claiming none — the honest version of E-E-A-T here is a
 * named operator, a working contact address, visible dates, and an explicit
 * statement of what the tools do not do.
 */
export const AUTHORSHIP = {
  /** Shown as author and publisher in structured data and on the pages. */
  name: OPERATOR.name,
  /** One line under "written and maintained by". */
  role: "Builder and maintainer of these calculators",
  /**
   * What we do and do not claim. Rendered verbatim on /about/ — do not soften
   * it into a claim of expertise we cannot back.
   */
  standing:
    "No financial, tax, or legal qualification is claimed or implied. These are arithmetic tools: every formula they use is stated on the page that uses it, and the working is shown so you can check it against your own contract or payslip.",
} as const;

/** The single-line notice carried by every calculator page. */
export const TOOL_DISCLAIMER =
  "This tool performs arithmetic only. It is not financial, tax, or legal advice.";
