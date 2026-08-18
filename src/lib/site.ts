/**
 * Site-wide constants and the tool map from the build brief.
 *
 * The domain is not decided yet. Set NEXT_PUBLIC_SITE_URL at build time and
 * every canonical / OG / JSON-LD URL follows; until then everything stays
 * relative and nothing hardcodes a wrong domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Work & Money Calculators";

/**
 * When each tool's formulas or copy last changed substantively. Maintained by
 * hand rather than taken from the build clock: a CSS tweak should not claim
 * that twenty calculators were reviewed that day.
 */
export const SITE_UPDATED = "2026-08-10";

export interface Tool {
  slug: string;
  /** Overrides SITE_UPDATED when a single tool changes on its own. */
  updated?: string;
  /** Page <h1> / card title. */
  title: string;
  /** One line for the "other calculators" list. */
  blurb: string;
  /** Not yet built — rendered as plain text, never as a dead link. */
  comingSoon?: boolean;
}

/** P1–P6 from the build brief, in build order (lowest KD first). */
export const TOOLS: Tool[] = [
  {
    slug: "salary-increase-calculator",
    title: "Salary Increase Calculator",
    blurb:
      "Work out a new salary from a raise percentage, a flat increase, or a target figure — and compare offers side by side.",
  },
  {
    slug: "time-to-decimal-calculator",
    title: "Time to Decimal Calculator",
    blurb:
      "Convert hours and minutes to decimal hours and back, with payroll rounding and a running timesheet total.",
  },
  {
    slug: "pto-calculator",
    title: "PTO Calculator",
    blurb:
      "Track paid time off accrual, project the balance to any date, and value a payout — with caps and carryover.",
  },
  {
    slug: "pro-rata-calculator",
    title: "Pro Rata Calculator",
    blurb:
      "Scale a full-time salary to part-time hours or to part of a year, by hours or by time served.",
  },
  {
    slug: "time-and-a-half-calculator",
    title: "Time and a Half Calculator",
    blurb:
      "Overtime pay at 1.5x, 2x, or a custom multiplier, including split tiers above a weekly threshold.",
  },
  {
    slug: "commission-calculator",
    title: "Commission Calculator",
    blurb:
      "Commission on sales at a flat or tiered rate, with base pay and on-target earnings.",
  },
  {
    slug: "billable-hours-calculator",
    title: "Billable Hours Calculator",
    blurb:
      "Log tasks, round each one up to your minimum increment, and get the billable total and invoice amount.",
  },
  {
    slug: "nanny-pay-calculator",
    title: "Nanny Pay Calculator",
    blurb:
      "Hourly rate, overtime, and an uplift for extra children, totalled into what is owed.",
  },
  {
    slug: "shift-differential-calculator",
    title: "Shift Differential Calculator",
    blurb:
      "Night, evening, and weekend premiums as a percentage or a flat rate, with your blended hourly rate.",
  },
  {
    slug: "retro-pay-calculator",
    title: "Retro Pay Calculator",
    blurb:
      "Back pay owed when a raise lands late, on an hourly rate or a salary.",
  },
  {
    slug: "real-estate-commission-calculator",
    title: "Real Estate Commission Calculator",
    blurb:
      "Total commission on a sale, split between both sides and then between each agent and their brokerage.",
  },
  {
    slug: "freelance-rate-calculator",
    title: "Freelance Rate Calculator",
    blurb:
      "Work back from target income, costs, and realistic billable days to the day rate you need to charge.",
  },
  {
    slug: "employee-cost-calculator",
    title: "Employee Cost Calculator",
    blurb:
      "Base salary plus employer charges and benefits: the true annual cost and the multiple of salary.",
  },
  {
    slug: "time-card-calculator",
    title: "Time Card Calculator",
    blurb:
      "Clock in and out with unpaid breaks, night shifts across midnight, and weekly overtime on a biweekly card.",
  },
  {
    slug: "hours-and-minutes-calculator",
    title: "Hours and Minutes Calculator",
    blurb:
      "Add and subtract times in h:mm, or measure the gap between two clock times including overnight.",
  },
  {
    slug: "salary-percentile-calculator",
    title: "Salary Percentile Calculator",
    blurb:
      "Place a salary against survey breakpoints or a list you supply, with the compa-ratio. No market data assumed.",
  },
  {
    slug: "wage-inflation-calculator",
    title: "Wage Inflation Calculator",
    blurb:
      "What a raise was really worth once prices are taken out, and the salary needed just to stand still.",
  },
  {
    slug: "prevailing-wage-calculator",
    title: "Prevailing Wage Calculator",
    blurb:
      "Base rate plus fringe from your wage determination, with benefit credits and overtime handled correctly.",
  },
  {
    slug: "work-schedule-maker",
    title: "Work Schedule Maker",
    blurb:
      "Build a one or two week shift rota with hours, overtime, and wage cost per person, and export it to CSV.",
  },
  {
    slug: "hourly-to-salary-calculator",
    title: "Hourly to Salary Calculator",
    blurb:
      "Turn an hourly rate into weekly, monthly, and annual pay — or go the other way, overtime included.",
  },
];

export function toolUpdated(tool: Tool | undefined): string {
  return tool?.updated ?? SITE_UPDATED;
}

export function toolPath(slug: string): string {
  return `/${slug}/`;
}

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function relatedTools(currentSlug: string): Tool[] {
  return TOOLS.filter((t) => t.slug !== currentSlug);
}
