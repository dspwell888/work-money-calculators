/**
 * Time ↔ decimal-hour conversion, with the rounding rules payroll actually
 * uses. Pure functions, no React.
 */

export interface HoursMinutes {
  hours: number;
  minutes: number;
  seconds: number;
}

/** Payroll rounding increments, in minutes. */
export const ROUNDINGS = ["none", "1", "5", "6", "15", "30"] as const;
export type Rounding = (typeof ROUNDINGS)[number];

export const ROUNDING_LABEL: Record<Rounding, string> = {
  none: "No rounding",
  "1": "Nearest minute",
  "5": "Nearest 5 min",
  "6": "Nearest 1/10 hour (6 min)",
  "15": "Nearest 1/4 hour (15 min)",
  "30": "Nearest 1/2 hour (30 min)",
};

export function toDecimal(t: HoursMinutes): number {
  return t.hours + t.minutes / 60 + t.seconds / 3600;
}

/** Round a decimal-hour figure to the given payroll increment. */
export function roundDecimal(decimal: number, rounding: Rounding): number {
  if (rounding === "none") return decimal;
  const step = Number(rounding) / 60;
  return Math.round(decimal / step) * step;
}

export function fromDecimal(decimal: number): HoursMinutes {
  const sign = decimal < 0 ? -1 : 1;
  const abs = Math.abs(decimal);
  const hours = Math.floor(abs);
  const remainderMinutes = (abs - hours) * 60;
  let minutes = Math.floor(remainderMinutes);
  // Seconds are rounded, which can carry all the way up: 1.99999 h must read
  // as 2:00:00, never 1:59:60.
  let seconds = Math.round((remainderMinutes - minutes) * 60);
  let carryHours = 0;
  if (seconds === 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes === 60) {
    minutes = 0;
    carryHours = 1;
  }
  return {
    hours: sign * (hours + carryHours),
    minutes: sign < 0 && hours + carryHours === 0 ? -minutes : minutes,
    seconds,
  };
}

/**
 * Nearest whole minute. Use this whenever a decimal figure is displayed as a
 * clock time without seconds, otherwise the conversion does not round-trip:
 * 7:20 becomes 7.33, and truncating 7.33 back would show 7:19.
 */
export function fromDecimalToMinute(decimal: number): HoursMinutes {
  const sign = decimal < 0 ? -1 : 1;
  const totalMinutes = Math.round(Math.abs(decimal) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hours: sign * hours,
    minutes: sign < 0 && hours === 0 ? -minutes : minutes,
    seconds: 0,
  };
}

/** "7:20" or "7:20:30" — the form timesheets use. */
export function formatClock(t: HoursMinutes, withSeconds = false): string {
  const neg = t.hours < 0 || t.minutes < 0;
  const h = Math.abs(t.hours);
  const m = Math.abs(t.minutes);
  const s = Math.abs(t.seconds);
  const base = `${neg ? "−" : ""}${h}:${String(m).padStart(2, "0")}`;
  return withSeconds ? `${base}:${String(s).padStart(2, "0")}` : base;
}

/** "7 h 20 m" — the form people say out loud. */
export function formatWords(t: HoursMinutes): string {
  const h = Math.abs(t.hours);
  const m = Math.abs(t.minutes);
  const neg = t.hours < 0 || t.minutes < 0 ? "−" : "";
  if (h === 0) return `${neg}${m} min`;
  if (m === 0) return `${neg}${h} h`;
  return `${neg}${h} h ${m} min`;
}

export function formatDecimal(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

/**
 * Accepts what people actually type into a timesheet field:
 * "7:20", "7.5", "7h20", "7h 20m", "7 20", "450m".
 * Returns null when nothing numeric can be found.
 */
export function parseTimeEntry(raw: string): HoursMinutes | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  // Bare minutes: "450m", "90 min"
  const minutesOnly = s.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes)$/);
  if (minutesOnly) {
    const total = Number(minutesOnly[1]);
    return fromDecimal(total / 60);
  }

  // Clock or h/m form: "7:20", "7:20:30", "7h20", "7h 20m", "7 20"
  const parts = s.match(
    /^(\d+(?:\.\d+)?)\s*(?::|h|hr|hrs|hours?|\s)\s*(\d+(?:\.\d+)?)?\s*(?:m|min|mins|minutes)?\s*(?::\s*(\d+(?:\.\d+)?))?$/,
  );
  if (parts) {
    return {
      hours: Number(parts[1]) || 0,
      minutes: Number(parts[2] ?? 0) || 0,
      seconds: Number(parts[3] ?? 0) || 0,
    };
  }

  // Plain decimal hours: "7.5"
  const decimal = Number(s.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(decimal) && s.match(/^\d*\.?\d+$/)) {
    return fromDecimal(decimal);
  }

  return null;
}

/** Reference rows for the conversion table in the page copy. */
export const COMMON_MINUTES = [
  1, 5, 6, 10, 12, 15, 20, 24, 30, 36, 40, 45, 50, 54, 55,
];

/* ---------------------------------------------------------------- */
/* Signed duration arithmetic (hours and minutes calculator)          */
/* ---------------------------------------------------------------- */

export type DurationSign = "+" | "-";

export interface SignedDuration {
  id: string;
  sign: DurationSign;
  /** Raw text, parsed with parseTimeEntry. */
  raw: string;
}

export interface SignedDurationLine {
  entry: SignedDuration;
  /** Null when the text cannot be read. */
  decimal: number | null;
  /** Running total after this line. */
  runningTotal: number;
}

export interface SignedDurationResult {
  lines: SignedDurationLine[];
  total: number;
  /** How many rows contributed. */
  counted: number;
}

/**
 * Add and subtract durations in order, keeping a running total so the working
 * is visible. The total may legitimately go negative — subtracting a longer
 * duration is a normal thing to want, and clamping it would hide a real
 * answer.
 */
export function sumSignedDurations(
  entries: SignedDuration[],
): SignedDurationResult {
  let total = 0;
  let counted = 0;

  const lines = entries.map((entry) => {
    const parsed = parseTimeEntry(entry.raw);
    const decimal = parsed === null ? null : toDecimal(parsed);
    if (decimal !== null) {
      total += entry.sign === "-" ? -decimal : decimal;
      counted += 1;
    }
    return { entry, decimal, runningTotal: total };
  });

  return { lines, total, counted };
}

/** Difference between two clock times, crossing midnight when needed. */
export function clockDifference(
  from: string,
  to: string,
): number | null {
  const a = parseTimeEntry(from);
  const b = parseTimeEntry(to);
  if (!a || !b) return null;
  const start = toDecimal(a);
  const end = toDecimal(b);
  // Same convention as the time card: an end at or before the start is the
  // next day.
  return end <= start ? end + 24 - start : end - start;
}
