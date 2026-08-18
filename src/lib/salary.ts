/**
 * Pure salary / pay-raise math. No React, no DOM — safe to unit test and to
 * import from server components.
 *
 * Everything is normalised through *annual* pay. A pay period is only ever a
 * lens onto the same annual number, so switching periods never changes the
 * underlying figure.
 */

export const PAY_PERIODS = [
  "hourly",
  "weekly",
  "biweekly",
  "monthly",
  "annual",
] as const;

export type PayPeriod = (typeof PAY_PERIODS)[number];

export const PAY_PERIOD_LABEL: Record<PayPeriod, string> = {
  hourly: "Per hour",
  weekly: "Per week",
  biweekly: "Every 2 weeks",
  monthly: "Per month",
  annual: "Per year",
};

/** Short form used inside sentences: "$1,200 per week". */
export const PAY_PERIOD_SUFFIX: Record<PayPeriod, string> = {
  hourly: "per hour",
  weekly: "per week",
  biweekly: "every 2 weeks",
  monthly: "per month",
  annual: "per year",
};

export interface WorkSchedule {
  /** Only affects the hourly lens. */
  hoursPerWeek: number;
  /** Only affects the hourly / weekly / biweekly lenses. */
  weeksPerYear: number;
}

export const DEFAULT_SCHEDULE: WorkSchedule = {
  hoursPerWeek: 40,
  weeksPerYear: 52,
};

/** How many of `period` fit in one year, given the schedule. */
export function periodsPerYear(period: PayPeriod, s: WorkSchedule): number {
  switch (period) {
    case "hourly":
      return s.hoursPerWeek * s.weeksPerYear;
    case "weekly":
      return s.weeksPerYear;
    case "biweekly":
      return s.weeksPerYear / 2;
    case "monthly":
      return 12;
    case "annual":
      return 1;
  }
}

export function toAnnual(
  amount: number,
  period: PayPeriod,
  s: WorkSchedule,
): number {
  return amount * periodsPerYear(period, s);
}

export function fromAnnual(
  annual: number,
  period: PayPeriod,
  s: WorkSchedule,
): number {
  const n = periodsPerYear(period, s);
  return n === 0 ? 0 : annual / n;
}

/** The same annual figure expressed in every period at once. */
export type PayBreakdown = Record<PayPeriod, number>;

export function breakdown(annual: number, s: WorkSchedule): PayBreakdown {
  return {
    hourly: fromAnnual(annual, "hourly", s),
    weekly: fromAnnual(annual, "weekly", s),
    biweekly: fromAnnual(annual, "biweekly", s),
    monthly: fromAnnual(annual, "monthly", s),
    annual,
  };
}

/**
 * The three ways people arrive at a raise:
 *   percent — "I'm getting a 4.5% raise"
 *   amount  — "They offered me another $5,000"
 *   target  — "I want to be on $95,000, what raise is that?"
 */
export type RaiseMode = "percent" | "amount" | "target";

export interface Scenario {
  id: string;
  label: string;
  mode: RaiseMode;
  /** Raise percentage. Used when mode === "percent". */
  percent: number;
  /** Flat increase, expressed in `amountPeriod`. Used when mode === "amount". */
  amount: number;
  amountPeriod: PayPeriod;
  /** Desired new pay, expressed in `targetPeriod`. Used when mode === "target". */
  target: number;
  targetPeriod: PayPeriod;
}

export interface RaiseResult {
  currentAnnual: number;
  newAnnual: number;
  /** Annual increase. Negative for a pay cut — we do not clamp it. */
  increaseAnnual: number;
  /** Percentage change from current to new. */
  percent: number;
  current: PayBreakdown;
  next: PayBreakdown;
  increase: PayBreakdown;
}

export function computeRaise(
  currentAnnual: number,
  scenario: Scenario,
  s: WorkSchedule,
): RaiseResult {
  let newAnnual: number;

  switch (scenario.mode) {
    case "percent":
      newAnnual = currentAnnual * (1 + scenario.percent / 100);
      break;
    case "amount":
      newAnnual =
        currentAnnual + toAnnual(scenario.amount, scenario.amountPeriod, s);
      break;
    case "target":
      newAnnual = toAnnual(scenario.target, scenario.targetPeriod, s);
      break;
  }

  const increaseAnnual = newAnnual - currentAnnual;
  // A raise on zero pay has no meaningful percentage — report 0 rather than
  // Infinity or NaN, both of which render as garbage.
  const percent = currentAnnual === 0 ? 0 : (increaseAnnual / currentAnnual) * 100;

  return {
    currentAnnual,
    newAnnual,
    increaseAnnual,
    percent,
    current: breakdown(currentAnnual, s),
    next: breakdown(newAnnual, s),
    increase: breakdown(increaseAnnual, s),
  };
}

/**
 * Optional scenario-only take-home view. The user types their own effective
 * rate — we never look up or imply any tax table. See the disclaimer in the UI.
 */
export function applyEstimatedRate(value: number, ratePercent: number): number {
  return value * (1 - ratePercent / 100);
}

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFmtWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number, whole = false): string {
  if (!Number.isFinite(value)) return "—";
  const fmt = whole ? currencyFmtWhole : currencyFmt;
  // Intl renders -0 as "-$0.00"; normalise it away.
  return fmt.format(Object.is(value, -0) ? 0 : value);
}

/**
 * For headline figures: drop the cents when there are none. "$63,000" reads as
 * a salary, "$63,000.00" reads as a receipt. Columns of money still use the
 * fixed two-decimal form so the digits line up.
 */
export function formatMoneyDisplay(value: number): string {
  return formatCurrency(value, Math.abs(value % 1) < 0.005);
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}

export function formatSigned(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

/** Parse a user-typed number, tolerating "$", "," and stray spaces. */
export function parseNumber(input: string): number {
  const cleaned = input.replace(/[^0-9.\-]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------------------------------------------ */
/* Inflation-adjusted (real) raise                                     */
/* ------------------------------------------------------------------ */

/**
 * A starting point for the inflation field, not a published statistic.
 *
 * There is deliberately no API call and no unlabelled constant here: inflation
 * differs by country, gets revised after publication, and any figure baked in
 * would be wrong for most visitors and stale within a year. The UI states this
 * next to the field and asks the visitor for their own number.
 */
export const DEFAULT_INFLATION_PERCENT = 3;

export interface RealRaiseResult {
  nominalPercent: number;
  inflationPercent: number;
  /** Exact real change: (1 + r) / (1 + i) − 1, as a percentage. */
  realPercent: number;
  /** The rule of thumb, r − i. Close at small rates, drifts at large ones. */
  approxPercent: number;
  /** The new salary expressed in the old salary's money. */
  realNewAnnual: number;
  /** Change in purchasing power, in today's money. Negative is a real cut. */
  purchasingPowerChange: number;
  /** What the new salary would have to be just to keep pace. */
  breakEvenAnnual: number;
  /** How far the new salary sits above or below break-even. */
  breakEvenGap: number;
  /** True when a nominal rise is a real-terms cut. */
  isRealCut: boolean;
}

/**
 * What a raise is worth once prices are taken out of it.
 *
 * The exact form is used rather than the familiar "raise minus inflation"
 * subtraction, for two reasons. The purchasing-power figure has to be exact —
 * it is the new salary deflated by prices, and the percentage is simply that
 * change expressed against the old salary. And /wage-inflation-calculator/
 * already compounds properly, so an approximation here would make two pages on
 * the same site disagree about the same question.
 *
 * The subtraction is still returned as `approxPercent`, because it is what
 * people say out loud and the gap between the two is worth seeing.
 */
export function computeRealRaise(
  currentAnnual: number,
  newAnnual: number,
  inflationPercent: number,
): RealRaiseResult {
  const nominalPercent =
    currentAnnual === 0 ? 0 : ((newAnnual - currentAnnual) / currentAnnual) * 100;

  const priceFactor = 1 + inflationPercent / 100;
  // A price factor of zero or less is not a real economy; fall back to "prices
  // did not move" rather than dividing by zero or flipping the sign.
  const safeFactor = priceFactor > 0 ? priceFactor : 1;

  const realNewAnnual = newAnnual / safeFactor;
  const purchasingPowerChange = realNewAnnual - currentAnnual;
  const realPercent =
    currentAnnual === 0 ? 0 : (purchasingPowerChange / currentAnnual) * 100;
  const breakEvenAnnual = currentAnnual * safeFactor;

  return {
    nominalPercent,
    inflationPercent,
    realPercent,
    approxPercent: nominalPercent - inflationPercent,
    realNewAnnual,
    purchasingPowerChange,
    breakEvenAnnual,
    breakEvenGap: newAnnual - breakEvenAnnual,
    isRealCut: purchasingPowerChange < 0,
  };
}

/** The one-sentence verdict shown under the figures. */
export function realRaiseVerdict(r: RealRaiseResult): string {
  const nominal = formatPercent(r.nominalPercent);
  const inflation = `${Number(r.inflationPercent.toFixed(2))}%`;
  const real = formatPercent(r.realPercent);

  if (r.inflationPercent === 0) {
    return `With prices flat, your ${nominal} raise is worth all of ${nominal}.`;
  }
  if (r.isRealCut) {
    return `You got ${nominal}, but prices rose ${inflation} — your buying power fell ${formatPercent(Math.abs(r.realPercent)).replace("+", "")}.`;
  }
  if (Math.abs(r.realPercent) < 0.005) {
    return `You got ${nominal} and prices rose ${inflation} — you are exactly where you started.`;
  }
  return `You got ${nominal}, prices rose ${inflation}, so you are genuinely ${real} better off.`;
}
