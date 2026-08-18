/**
 * Billable hours, nanny pay, and shift differential. Pure functions.
 *
 * All gross. Nothing here touches tax.
 */

/* ---------------------------------------------------------------- */
/* Billable hours                                                    */
/* ---------------------------------------------------------------- */

/** Minimum billing increments, in minutes. The trade uses all of these. */
export const INCREMENTS = ["1", "6", "10", "15", "30"] as const;
export type Increment = (typeof INCREMENTS)[number];

export const INCREMENT_LABEL: Record<Increment, string> = {
  "1": "Actual minutes",
  "6": "6 min (0.1 h)",
  "10": "10 min (1/6 h)",
  "15": "15 min (1/4 h)",
  "30": "30 min (1/2 h)",
};

export interface BillableEntry {
  id: string;
  task: string;
  /** Raw minutes worked, before the increment is applied. */
  minutes: number;
}

export interface BilledEntry {
  entry: BillableEntry;
  rawMinutes: number;
  /** Minutes after rounding up to the increment. */
  billedMinutes: number;
  billedHours: number;
  amount: number;
}

export interface BillableResult {
  lines: BilledEntry[];
  rawHours: number;
  billedHours: number;
  /** Hours added purely by the rounding rule. */
  upliftHours: number;
  total: number;
}

/**
 * Round UP to the increment — the defining rule of billable time. Six minutes
 * of work on a 15-minute increment bills a quarter hour, which is why the
 * increment matters more than the rate on short tasks.
 */
export function roundUpMinutes(minutes: number, increment: Increment): number {
  const step = Number(increment);
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / step) * step;
}

export function computeBillable(
  entries: BillableEntry[],
  increment: Increment,
  hourlyRate: number,
): BillableResult {
  const lines = entries.map((entry) => {
    const rawMinutes = Math.max(entry.minutes, 0);
    const billedMinutes = roundUpMinutes(rawMinutes, increment);
    const billedHours = billedMinutes / 60;
    return {
      entry,
      rawMinutes,
      billedMinutes,
      billedHours,
      amount: billedHours * hourlyRate,
    };
  });

  // Sum minutes, then convert once. Summing per-line fractional hours
  // accumulates float error, which shows up as a 2-hour sheet reporting
  // 1.9999999999999998 and an uplift of -2e-16.
  const rawMinutes = lines.reduce((s, l) => s + l.rawMinutes, 0);
  const billedMinutes = lines.reduce((s, l) => s + l.billedMinutes, 0);

  return {
    lines,
    rawHours: rawMinutes / 60,
    billedHours: billedMinutes / 60,
    upliftHours: (billedMinutes - rawMinutes) / 60,
    // Totalled from the per-line amounts, the way an invoice adds up.
    total: lines.reduce((s, l) => s + l.amount, 0),
  };
}

/**
 * Parse a duration the way a timesheet field is actually filled in:
 * "1:30", "1.5", "90m", "1h30". Returns minutes.
 */
export function parseDuration(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  const bareMinutes = s.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes)$/);
  if (bareMinutes) return Number(bareMinutes[1]);

  const split = s.match(
    /^(\d+(?:\.\d+)?)\s*(?::|h|hr|hrs|hours?|\s)\s*(\d+(?:\.\d+)?)?\s*(?:m|min|mins|minutes)?$/,
  );
  if (split) {
    return Number(split[1]) * 60 + Number(split[2] ?? 0);
  }

  if (/^\d*\.?\d+$/.test(s)) return Number(s) * 60;
  return null;
}

/* ---------------------------------------------------------------- */
/* Nanny / babysitter pay                                            */
/* ---------------------------------------------------------------- */

export interface NannyInput {
  hourlyRate: number;
  regularHours: number;
  overtimeHours: number;
  overtimeMultiplier: number;
  /** Children beyond the first. */
  extraChildren: number;
  /** Extra per hour for each additional child. */
  perExtraChildRate: number;
  /** Flat amounts: travel, late fee, holiday bonus. */
  extras: number;
}

export interface NannyResult {
  effectiveRate: number;
  regularPay: number;
  overtimeRate: number;
  overtimePay: number;
  extras: number;
  total: number;
  totalHours: number;
  /** What the whole engagement averages per hour. */
  blendedRate: number;
}

export function computeNannyPay(i: NannyInput): NannyResult {
  // The per-child uplift raises the base rate, so overtime is calculated on
  // the uplifted rate — a sitter watching three children earns the multiplier
  // on the rate they are actually working at.
  const effectiveRate =
    i.hourlyRate + Math.max(i.extraChildren, 0) * i.perExtraChildRate;
  const regularPay = effectiveRate * i.regularHours;
  const overtimeRate = effectiveRate * i.overtimeMultiplier;
  const overtimePay = overtimeRate * i.overtimeHours;
  const totalHours = i.regularHours + i.overtimeHours;
  const total = regularPay + overtimePay + i.extras;

  return {
    effectiveRate,
    regularPay,
    overtimeRate,
    overtimePay,
    extras: i.extras,
    total,
    totalHours,
    blendedRate: totalHours > 0 ? total / totalHours : 0,
  };
}

/* ---------------------------------------------------------------- */
/* Shift differential                                                */
/* ---------------------------------------------------------------- */

export type DifferentialKind = "percent" | "flat";

export interface Shift {
  id: string;
  name: string;
  hours: number;
  /** Percentage uplift, or flat dollars per hour, per `kind`. */
  differential: number;
}

export interface ShiftLine {
  shift: Shift;
  rate: number;
  /** The uplift portion of the rate, per hour. */
  premiumPerHour: number;
  basePay: number;
  premiumPay: number;
  total: number;
}

export interface ShiftResult {
  lines: ShiftLine[];
  totalHours: number;
  basePay: number;
  premiumPay: number;
  total: number;
  blendedRate: number;
}

export function computeShifts(
  baseRate: number,
  shifts: Shift[],
  kind: DifferentialKind,
): ShiftResult {
  const lines = shifts.map((shift) => {
    const premiumPerHour =
      kind === "percent"
        ? baseRate * (shift.differential / 100)
        : shift.differential;
    const rate = baseRate + premiumPerHour;
    return {
      shift,
      rate,
      premiumPerHour,
      basePay: baseRate * shift.hours,
      premiumPay: premiumPerHour * shift.hours,
      total: rate * shift.hours,
    };
  });

  const totalHours = lines.reduce((s, l) => s + l.shift.hours, 0);
  const basePay = lines.reduce((s, l) => s + l.basePay, 0);
  const premiumPay = lines.reduce((s, l) => s + l.premiumPay, 0);
  const total = basePay + premiumPay;

  return {
    lines,
    totalHours,
    basePay,
    premiumPay,
    total,
    blendedRate: totalHours > 0 ? total / totalHours : 0,
  };
}
