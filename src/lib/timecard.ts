/**
 * Time card: clock in, clock out, break deduction, weekly and biweekly totals.
 *
 * Two modelling decisions are made here deliberately. Both are documented
 * because they change the answer and a reviewer should be able to check them:
 *
 *   1. CROSS-MIDNIGHT. When clock-out is at or before clock-in, the shift is
 *      treated as ending the next day. 22:00 → 06:00 is 8 hours, not −16.
 *      There is no way to distinguish a night shift from a typo, and the night
 *      shift is overwhelmingly more likely on a time card.
 *
 *   2. OVERTIME IS WEEKLY, NEVER PER CARD. A biweekly card is two separate
 *      weeks for overtime purposes: 50 hours then 30 is ten hours of overtime,
 *      not zero. Averaging across the card would understate what is owed, and
 *      that is the error this calculator exists to avoid.
 */

export const WEEK_STARTS = ["sunday", "monday"] as const;
export type WeekStart = (typeof WEEK_STARTS)[number];

export const WEEK_START_LABEL: Record<WeekStart, string> = {
  sunday: "Sunday",
  monday: "Monday",
};

export interface TimeCardEntry {
  id: string;
  /** ISO date, yyyy-mm-dd. Used only to group days into weeks. */
  date: string;
  /** 24-hour "HH:MM". */
  start: string;
  end: string;
  /** Unpaid break, in minutes. */
  breakMinutes: number;
}

export interface TimeCardDay {
  entry: TimeCardEntry;
  /** Null when the times cannot be read. */
  workedMinutes: number | null;
  crossedMidnight: boolean;
  /** True when the break is longer than the shift. */
  breakTooLong: boolean;
}

export interface WeekSummary {
  /** ISO date of the week's first day. */
  weekStart: string;
  days: TimeCardDay[];
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  regularPay: number;
  overtimePay: number;
  pay: number;
}

export interface TimeCardResult {
  days: TimeCardDay[];
  weeks: WeekSummary[];
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

const MINUTES_PER_DAY = 1440;

/** "HH:MM" → minutes past midnight. Null when unreadable. */
export function parseClock(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2})\s*[:.]?\s*(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatHours(minutes: number): string {
  if (!Number.isFinite(minutes)) return "—";
  return (Math.round((minutes / 60) * 100) / 100).toFixed(2);
}

export function formatClockDuration(minutes: number): string {
  if (!Number.isFinite(minutes)) return "—";
  const sign = minutes < 0 ? "−" : "";
  const abs = Math.abs(Math.round(minutes));
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
}

export function parseDay(entry: TimeCardEntry): TimeCardDay {
  const start = parseClock(entry.start);
  const end = parseClock(entry.end);
  if (start === null || end === null) {
    return {
      entry,
      workedMinutes: null,
      crossedMidnight: false,
      breakTooLong: false,
    };
  }

  // See decision 1 at the top of this file.
  const crossedMidnight = end <= start;
  const span = crossedMidnight ? end + MINUTES_PER_DAY - start : end - start;
  const breakMinutes = Math.max(entry.breakMinutes, 0);
  const worked = span - breakMinutes;

  return {
    entry,
    // A break longer than the shift yields zero, not a negative day.
    workedMinutes: Math.max(worked, 0),
    crossedMidnight,
    breakTooLong: worked < 0,
  };
}

/** The date of the week's first day, as yyyy-mm-dd. */
export function weekStartOf(iso: string, weekStart: WeekStart): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  const dow = d.getUTCDay(); // 0 = Sunday
  const offset = weekStart === "sunday" ? dow : (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

export function computeTimeCard(
  entries: TimeCardEntry[],
  hourlyRate: number,
  weeklyOvertimeThresholdHours: number,
  overtimeMultiplier: number,
  weekStart: WeekStart,
): TimeCardResult {
  const days = entries.map(parseDay);
  const thresholdMinutes = Math.max(weeklyOvertimeThresholdHours, 0) * 60;

  // See decision 2: group into weeks and apply the threshold to each.
  const buckets = new Map<string, TimeCardDay[]>();
  for (const day of days) {
    if (day.workedMinutes === null) continue;
    const key = weekStartOf(day.entry.date, weekStart);
    const list = buckets.get(key) ?? [];
    list.push(day);
    buckets.set(key, list);
  }

  const weeks: WeekSummary[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStartDate, weekDays]) => {
      const totalMinutes = weekDays.reduce(
        (s, d) => s + (d.workedMinutes ?? 0),
        0,
      );
      const regularMinutes =
        thresholdMinutes > 0
          ? Math.min(totalMinutes, thresholdMinutes)
          : totalMinutes;
      const overtimeMinutes = totalMinutes - regularMinutes;
      const regularPay = (regularMinutes / 60) * hourlyRate;
      const overtimePay =
        (overtimeMinutes / 60) * hourlyRate * overtimeMultiplier;
      return {
        weekStart: weekStartDate,
        days: weekDays,
        totalMinutes,
        regularMinutes,
        overtimeMinutes,
        regularPay,
        overtimePay,
        pay: regularPay + overtimePay,
      };
    });

  const sum = (pick: (w: WeekSummary) => number) =>
    weeks.reduce((s, w) => s + pick(w), 0);

  return {
    days,
    weeks,
    totalMinutes: sum((w) => w.totalMinutes),
    regularMinutes: sum((w) => w.regularMinutes),
    overtimeMinutes: sum((w) => w.overtimeMinutes),
    regularPay: sum((w) => w.regularPay),
    overtimePay: sum((w) => w.overtimePay),
    totalPay: sum((w) => w.pay),
  };
}
