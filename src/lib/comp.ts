/**
 * Salary percentiles, wage inflation, and prevailing wage. Pure functions.
 *
 * All three of these pages naturally invite hardcoded external data — market
 * salary surveys, CPI series, government wage determinations. None of it is
 * embedded here, deliberately:
 *
 *   - It goes stale annually and silently, which is worse than absent.
 *   - It is jurisdiction-specific, so any single figure is wrong for most
 *     visitors.
 *   - Being wrong about someone's pay costs them real money.
 *
 * Every rate, breakpoint, and index in this file comes from the caller.
 */

/* ---------------------------------------------------------------- */
/* Salary percentile                                                 */
/* ---------------------------------------------------------------- */

export interface PercentileFromList {
  /** Percentile rank, 0-100. */
  percentile: number;
  below: number;
  equal: number;
  above: number;
  count: number;
  min: number;
  max: number;
  median: number;
  /** Salary divided by the median, the usual compa-ratio shorthand. */
  compaRatio: number;
}

/**
 * Percentile rank of `value` within `values`, using the mid-rank definition:
 * everything strictly below, plus half of anything exactly equal, over the
 * count. This is the "PERCENTRANK.INC"-style convention and it is symmetric —
 * the lowest and highest members of a set do not come out as 0 and 100 when
 * they are tied with someone else.
 */
export function percentileFromList(
  values: number[],
  value: number,
): PercentileFromList | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return null;

  const sorted = [...clean].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  const equal = sorted.filter((v) => v === value).length;
  const above = sorted.length - below - equal;
  const median = medianOf(sorted);

  return {
    percentile: ((below + equal / 2) / sorted.length) * 100,
    below,
    equal,
    above,
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
    compaRatio: median === 0 ? 0 : value / median,
  };
}

export function medianOf(sortedValues: number[]): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

export interface Breakpoint {
  id: string;
  /** 0-100. */
  percentile: number;
  salary: number;
}

export interface PercentileFromBreakpoints {
  percentile: number;
  /** True when the salary sits outside the surveyed range. */
  clamped: boolean;
  /** The two breakpoints the salary falls between, for showing the working. */
  lower: Breakpoint | null;
  upper: Breakpoint | null;
  median: number | null;
  compaRatio: number;
}

/**
 * Percentile of a salary against published survey breakpoints (p25 / p50 / p75
 * and so on), by linear interpolation between the two surrounding points.
 *
 * A salary outside the surveyed range is clamped to the end percentile and
 * flagged, rather than extrapolated — a survey that stops at p90 says nothing
 * about p97, and inventing it would be the most misleading thing this page
 * could do.
 */
export function percentileFromBreakpoints(
  breakpoints: Breakpoint[],
  salary: number,
): PercentileFromBreakpoints | null {
  const clean = breakpoints
    .filter((b) => Number.isFinite(b.salary) && Number.isFinite(b.percentile))
    .sort((a, b) => a.salary - b.salary);
  if (clean.length === 0) return null;

  const p50 = clean.find((b) => b.percentile === 50);
  const median = p50 ? p50.salary : null;
  const compa = median && median !== 0 ? salary / median : 0;

  if (salary <= clean[0].salary) {
    return {
      percentile: clean[0].percentile,
      clamped: salary < clean[0].salary,
      lower: null,
      upper: clean[0],
      median,
      compaRatio: compa,
    };
  }

  const last = clean[clean.length - 1];
  if (salary >= last.salary) {
    return {
      percentile: last.percentile,
      clamped: salary > last.salary,
      lower: last,
      upper: null,
      median,
      compaRatio: compa,
    };
  }

  for (let i = 0; i < clean.length - 1; i++) {
    const lo = clean[i];
    const hi = clean[i + 1];
    if (salary >= lo.salary && salary <= hi.salary) {
      const span = hi.salary - lo.salary;
      const t = span === 0 ? 0 : (salary - lo.salary) / span;
      return {
        percentile: lo.percentile + t * (hi.percentile - lo.percentile),
        clamped: false,
        lower: lo,
        upper: hi,
        median,
        compaRatio: compa,
      };
    }
  }

  return null;
}

/* ---------------------------------------------------------------- */
/* Wage inflation                                                    */
/* ---------------------------------------------------------------- */

export interface WageInflationInput {
  startSalary: number;
  endSalary: number;
  years: number;
  /** Average annual inflation over the period, supplied by the user. */
  annualInflationPercent: number;
}

export interface WageInflationResult {
  /** What the end salary is worth in start-year money. */
  realEndSalary: number;
  /** Change in real terms, in start-year money. */
  realChange: number;
  realChangePercent: number;
  nominalChange: number;
  nominalChangePercent: number;
  /** The salary needed simply to stand still. */
  breakEvenSalary: number;
  /** How far above or below break-even the end salary is. */
  shortfall: number;
  /** Compound annual growth of the nominal figure. */
  nominalCagrPercent: number;
  /** Compound annual growth after inflation. */
  realCagrPercent: number;
  /** Cumulative price rise over the whole period. */
  cumulativeInflationPercent: number;
}

export function computeWageInflation(
  i: WageInflationInput,
): WageInflationResult {
  const years = Math.max(i.years, 0);
  const factor = Math.pow(1 + i.annualInflationPercent / 100, years);

  const realEndSalary = factor === 0 ? 0 : i.endSalary / factor;
  const breakEvenSalary = i.startSalary * factor;
  const nominalChange = i.endSalary - i.startSalary;
  const realChange = realEndSalary - i.startSalary;

  const cagr = (from: number, to: number) =>
    from <= 0 || years <= 0 ? 0 : (Math.pow(to / from, 1 / years) - 1) * 100;

  return {
    realEndSalary,
    realChange,
    realChangePercent:
      i.startSalary === 0 ? 0 : (realChange / i.startSalary) * 100,
    nominalChange,
    nominalChangePercent:
      i.startSalary === 0 ? 0 : (nominalChange / i.startSalary) * 100,
    breakEvenSalary,
    shortfall: i.endSalary - breakEvenSalary,
    nominalCagrPercent: cagr(i.startSalary, i.endSalary),
    realCagrPercent: cagr(i.startSalary, realEndSalary),
    cumulativeInflationPercent: (factor - 1) * 100,
  };
}

/* ---------------------------------------------------------------- */
/* Prevailing wage                                                   */
/* ---------------------------------------------------------------- */

export interface PrevailingWageInput {
  /** Basic hourly rate from the wage determination. */
  baseRate: number;
  /** Fringe rate from the determination, per hour. */
  fringeRate: number;
  /** Value per hour of bona fide benefits actually provided. */
  fringeCreditPerHour: number;
  regularHours: number;
  overtimeHours: number;
  overtimeMultiplier: number;
}

export interface PrevailingWageResult {
  totalHours: number;
  regularPay: number;
  overtimePay: number;
  /** Cash still owed per hour because benefits fall short of the fringe rate. */
  fringeShortfallPerHour: number;
  fringeCashOwed: number;
  /** Value of benefits actually provided across all hours. */
  fringeCreditValue: number;
  totalCashDue: number;
  /** Cash plus the value of benefits — the full package. */
  totalPackage: number;
  /** Cash per hour, the figure that appears on the certified payroll. */
  effectiveCashRate: number;
}

/**
 * Overtime premium applies to the BASE rate only; the fringe rate is owed at
 * straight time for every hour worked, overtime hours included. Folding fringe
 * into the overtime multiplier overstates what is due, and leaving it off the
 * overtime hours understates it — both are common mistakes on certified
 * payroll.
 */
export function computePrevailingWage(
  i: PrevailingWageInput,
): PrevailingWageResult {
  const totalHours = Math.max(i.regularHours, 0) + Math.max(i.overtimeHours, 0);
  const regularPay = i.baseRate * Math.max(i.regularHours, 0);
  const overtimePay =
    i.baseRate * i.overtimeMultiplier * Math.max(i.overtimeHours, 0);

  const fringeShortfallPerHour = Math.max(
    i.fringeRate - i.fringeCreditPerHour,
    0,
  );
  const fringeCashOwed = fringeShortfallPerHour * totalHours;
  const fringeCreditValue =
    Math.min(i.fringeCreditPerHour, i.fringeRate) * totalHours;

  const totalCashDue = regularPay + overtimePay + fringeCashOwed;

  return {
    totalHours,
    regularPay,
    overtimePay,
    fringeShortfallPerHour,
    fringeCashOwed,
    fringeCreditValue,
    totalCashDue,
    totalPackage: totalCashDue + fringeCreditValue,
    effectiveCashRate: totalHours > 0 ? totalCashDue / totalHours : 0,
  };
}
