/**
 * Shared pay arithmetic for the pro rata, overtime, commission, and
 * hourly-to-salary calculators. Pure functions, no React.
 *
 * None of this touches tax. Where a page shows a take-home figure it applies a
 * rate the visitor typed in, and says so.
 */

import { formatCurrency, type PayPeriod, type WorkSchedule } from "./salary";

export { formatCurrency };
export type { PayPeriod, WorkSchedule };

/* ---------------------------------------------------------------- */
/* Pro rata                                                          */
/* ---------------------------------------------------------------- */

export interface ProRataByHours {
  fullTimeSalary: number;
  fullTimeHours: number;
  actualHours: number;
}

export function proRataByHours(i: ProRataByHours): number {
  if (i.fullTimeHours <= 0) return 0;
  return i.fullTimeSalary * (i.actualHours / i.fullTimeHours);
}

/** Units a partial year can be expressed in. */
export const TERM_UNITS = ["weeks", "months", "days"] as const;
export type TermUnit = (typeof TERM_UNITS)[number];

export const TERM_UNIT_LABEL: Record<TermUnit, string> = {
  weeks: "Weeks",
  months: "Months",
  days: "Days",
};

export const TERM_UNIT_TOTAL: Record<TermUnit, number> = {
  weeks: 52,
  months: 12,
  days: 365,
};

export function proRataByTerm(
  fullTimeSalary: number,
  served: number,
  unit: TermUnit,
): number {
  const total = TERM_UNIT_TOTAL[unit];
  return fullTimeSalary * (served / total);
}

/* ---------------------------------------------------------------- */
/* Overtime                                                          */
/* ---------------------------------------------------------------- */

export interface OvertimeTier {
  id: string;
  /** Hours worked at this multiplier. */
  hours: number;
  multiplier: number;
}

export interface OvertimeResult {
  regularPay: number;
  tiers: { tier: OvertimeTier; rate: number; pay: number }[];
  overtimePay: number;
  totalPay: number;
  totalHours: number;
  /** What the whole week averages out to per hour. */
  blendedRate: number;
}

export function computeOvertime(
  baseRate: number,
  regularHours: number,
  tiers: OvertimeTier[],
): OvertimeResult {
  const regularPay = baseRate * regularHours;
  const detailed = tiers.map((tier) => {
    const rate = baseRate * tier.multiplier;
    return { tier, rate, pay: rate * tier.hours };
  });
  const overtimePay = detailed.reduce((sum, t) => sum + t.pay, 0);
  const totalHours =
    regularHours + tiers.reduce((sum, t) => sum + t.hours, 0);
  const totalPay = regularPay + overtimePay;
  return {
    regularPay,
    tiers: detailed,
    overtimePay,
    totalPay,
    totalHours,
    blendedRate: totalHours > 0 ? totalPay / totalHours : 0,
  };
}

/* ---------------------------------------------------------------- */
/* Commission                                                        */
/* ---------------------------------------------------------------- */

export interface CommissionBracket {
  id: string;
  /** Sales from this figure up to the next bracket's threshold. */
  from: number;
  ratePercent: number;
}

export interface CommissionSlice {
  from: number;
  to: number | null;
  amountInBand: number;
  ratePercent: number;
  commission: number;
}

export interface CommissionResult {
  slices: CommissionSlice[];
  commission: number;
  basePay: number;
  total: number;
  /** Commission as a share of the sales it came from. */
  effectiveRate: number;
}

/**
 * Marginal (band-by-band) tiered commission: each slice of sales earns the
 * rate for the band it falls in, not the top rate on the whole amount. This is
 * how commission plans are normally written; the alternative ("whole amount at
 * the highest rate reached") is a cliff and is rare.
 */
export function computeCommission(
  sales: number,
  brackets: CommissionBracket[],
  basePay: number,
): CommissionResult {
  const sorted = [...brackets].sort((a, b) => a.from - b.from);
  const slices: CommissionSlice[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const band = sorted[i];
    const next = sorted[i + 1];
    const to = next ? next.from : null;
    if (sales <= band.from) break;
    const upper = to === null ? sales : Math.min(sales, to);
    const amountInBand = upper - band.from;
    if (amountInBand <= 0) continue;
    slices.push({
      from: band.from,
      to,
      amountInBand,
      ratePercent: band.ratePercent,
      commission: (amountInBand * band.ratePercent) / 100,
    });
  }

  const commission = slices.reduce((sum, s) => sum + s.commission, 0);
  return {
    slices,
    commission,
    basePay,
    total: commission + basePay,
    effectiveRate: sales > 0 ? (commission / sales) * 100 : 0,
  };
}

/* ---------------------------------------------------------------- */
/* Hourly ↔ salary                                                   */
/* ---------------------------------------------------------------- */

export interface HourlySalaryInput {
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  /** Paid overtime hours per week, on top of hoursPerWeek. */
  overtimeHours: number;
  overtimeMultiplier: number;
  /** Unpaid days off already inside weeksPerYear, subtracted from the year. */
  unpaidDaysOff: number;
}

export interface HourlySalaryResult {
  regularAnnual: number;
  overtimeAnnual: number;
  annual: number;
  monthly: number;
  biweekly: number;
  weekly: number;
  daily: number;
  hourly: number;
  paidHoursPerYear: number;
}

export function computeHourlySalary(i: HourlySalaryInput): HourlySalaryResult {
  const daysPerWeek = 5;
  const unpaidWeeks = Math.max(i.unpaidDaysOff, 0) / daysPerWeek;
  const paidWeeks = Math.max(i.weeksPerYear - unpaidWeeks, 0);
  const regularHours = Math.max(i.hoursPerWeek, 0);
  const overtimeHours = Math.max(i.overtimeHours, 0);

  const regularAnnual = i.hourlyRate * regularHours * paidWeeks;
  const overtimeAnnual =
    i.hourlyRate * i.overtimeMultiplier * overtimeHours * paidWeeks;
  const annual = regularAnnual + overtimeAnnual;
  const paidHoursPerYear = (regularHours + overtimeHours) * paidWeeks;

  return {
    regularAnnual,
    overtimeAnnual,
    annual,
    monthly: annual / 12,
    biweekly: paidWeeks > 0 ? annual / (paidWeeks / 2) : 0,
    weekly: paidWeeks > 0 ? annual / paidWeeks : 0,
    daily: paidWeeks > 0 ? annual / (paidWeeks * daysPerWeek) : 0,
    hourly: i.hourlyRate,
    paidHoursPerYear,
  };
}

/** Salary → the hourly rate it implies. */
export function salaryToHourly(
  annual: number,
  hoursPerWeek: number,
  weeksPerYear: number,
  options: {
    overtimeHours?: number;
    overtimeMultiplier?: number;
    unpaidDaysOff?: number;
  } = {},
): number {
  const paidWeeks = Math.max(
    weeksPerYear - Math.max(options.unpaidDaysOff ?? 0, 0) / 5,
    0,
  );
  const regularHours = Math.max(hoursPerWeek, 0);
  const overtimeHours = Math.max(options.overtimeHours ?? 0, 0);
  const overtimeMultiplier = options.overtimeMultiplier ?? 1.5;
  // Solve the same annual-pay equation used by computeHourlySalary for its
  // base hourly rate. Overtime hours count at their multiplier; unpaid days
  // reduce the paid weeks. This keeps both directions true inverses.
  const weightedHours =
    (regularHours + overtimeHours * overtimeMultiplier) * paidWeeks;
  return weightedHours > 0 ? annual / weightedHours : 0;
}
