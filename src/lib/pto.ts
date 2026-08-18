/**
 * PTO accrual and payout. Pure functions, no React.
 *
 * Accrual is deliberately modelled as "completed periods since the start
 * date", because that is how employers actually credit it: you do not get a
 * fortnight's PTO half way through the fortnight.
 */

export const ACCRUAL_PERIODS = [
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "annual",
] as const;

export type AccrualPeriod = (typeof ACCRUAL_PERIODS)[number];

export const ACCRUAL_PERIOD_LABEL: Record<AccrualPeriod, string> = {
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  semimonthly: "Twice a month",
  monthly: "Every month",
  annual: "Once a year",
};

/** How many times a period comes round in a year. */
export const PERIODS_PER_YEAR: Record<AccrualPeriod, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  annual: 1,
};

/** PTO is quoted in either unit depending on the employer. */
export const BALANCE_UNITS = ["hours", "days"] as const;
export type BalanceUnit = (typeof BALANCE_UNITS)[number];

export interface AccrualInput {
  /** ISO date, yyyy-mm-dd. */
  startDate: string;
  /** ISO date the balance is calculated up to. */
  asOfDate: string;
  /** Amount credited each period, in `unit`. */
  ratePerPeriod: number;
  period: AccrualPeriod;
  unit: BalanceUnit;
  /** Hours in a working day, used to convert between the two units. */
  hoursPerDay: number;
  /** Already taken, in `unit`. */
  used: number;
  /** Balance carried in from last year, in `unit`. 0 for none. */
  carryover: number;
  /** Maximum balance that can be held at once. 0 means no cap. */
  cap: number;
}

export interface AccrualResult {
  /** Whole periods elapsed between the two dates. */
  periodsElapsed: number;
  /** Accrued this cycle, before the cap. */
  accruedRaw: number;
  /** Accrued plus carryover, after the cap is applied. */
  accrued: number;
  /** How much the cap threw away. Zero when uncapped or under it. */
  forfeited: number;
  used: number;
  balance: number;
  /** Same figures in hours and days, whatever unit was entered. */
  balanceHours: number;
  balanceDays: number;
  accruedPerYear: number;
  /** Null when either date is unusable. */
  daysBetween: number | null;
}

const MS_PER_DAY = 86_400_000;

function parseDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole months from `a` to `b`, not counting a partial final month. */
function wholeMonthsBetween(a: Date, b: Date): number {
  let months =
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  return Math.max(months, 0);
}

/**
 * Completed accrual periods between two dates. Partial periods do not count —
 * an employer credits the whole amount at the end of the period or not at all.
 */
export function periodsElapsed(
  start: Date,
  asOf: Date,
  period: AccrualPeriod,
): number {
  if (asOf <= start) return 0;
  const days = Math.floor((asOf.getTime() - start.getTime()) / MS_PER_DAY);
  switch (period) {
    case "weekly":
      return Math.floor(days / 7);
    case "biweekly":
      return Math.floor(days / 14);
    case "semimonthly":
      // Two credits a month: one at the whole-month mark, one at the halfway
      // point after it.
      return Math.floor(wholeMonthsBetween(start, asOf) * 2 + halfMonthBonus(start, asOf));
    case "monthly":
      return wholeMonthsBetween(start, asOf);
    case "annual":
      return Math.floor(wholeMonthsBetween(start, asOf) / 12);
  }
}

/**
 * 1 when the mid-month credit has landed since the last whole-month
 * anniversary. The threshold is 14 days rather than a true half-month,
 * because semimonthly payroll conventionally pays on the 15th and the last
 * day — someone starting on the 1st is credited on the 15th, not the 16th.
 */
const HALF_MONTH_DAYS = 14;

function halfMonthBonus(start: Date, asOf: Date): number {
  const months = wholeMonthsBetween(start, asOf);
  const anniversary = new Date(start.getTime());
  anniversary.setUTCMonth(anniversary.getUTCMonth() + months);
  const daysSince = Math.floor(
    (asOf.getTime() - anniversary.getTime()) / MS_PER_DAY,
  );
  return daysSince >= HALF_MONTH_DAYS ? 1 : 0;
}

export function computeAccrual(i: AccrualInput): AccrualResult {
  const start = parseDate(i.startDate);
  const asOf = parseDate(i.asOfDate);
  const hoursPerDay = i.hoursPerDay > 0 ? i.hoursPerDay : 8;

  const elapsed = start && asOf ? periodsElapsed(start, asOf, i.period) : 0;
  const accruedRaw = elapsed * i.ratePerPeriod;
  const beforeCap = accruedRaw + i.carryover;

  // A cap limits the balance you can hold, not the amount you can earn in a
  // year — anything above it is lost rather than banked.
  const capped = i.cap > 0 ? Math.min(beforeCap, i.cap) : beforeCap;
  const forfeited = beforeCap - capped;

  const balance = capped - i.used;
  const toHours = (v: number) => (i.unit === "hours" ? v : v * hoursPerDay);
  const toDays = (v: number) => (i.unit === "days" ? v : v / hoursPerDay);

  return {
    periodsElapsed: elapsed,
    accruedRaw,
    accrued: capped,
    forfeited,
    used: i.used,
    balance,
    balanceHours: toHours(balance),
    balanceDays: toDays(balance),
    accruedPerYear: i.ratePerPeriod * PERIODS_PER_YEAR[i.period],
    daysBetween:
      start && asOf
        ? Math.max(Math.floor((asOf.getTime() - start.getTime()) / MS_PER_DAY), 0)
        : null,
  };
}

/** PTO cashed out at the hourly rate. Gross — no deductions applied. */
export function computePayout(balanceHours: number, hourlyRate: number): number {
  return Math.max(balanceHours, 0) * hourlyRate;
}

export function formatBalance(value: number, unit: BalanceUnit): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${unit === "hours" ? "h" : rounded === 1 ? "day" : "days"}`;
}

