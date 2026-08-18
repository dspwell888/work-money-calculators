/**
 * Multi-employee shift roster: a grid of people against days, built from a
 * small library of named shifts.
 *
 * Conventions, all shared deliberately with the time card so the two tools can
 * never disagree about the same week:
 *
 *   - A shift whose end is at or before its start crosses midnight
 *     (see timecard.ts, decision 1).
 *   - Unpaid break minutes come off each shift, clamped at zero.
 *   - Overtime is weekly. Weeks here run from the SCHEDULE START DATE in
 *     blocks of seven, not from the calendar — set the start date to your
 *     workweek start and the two agree.
 */

import { parseClock } from "./timecard";

export const OFF = "-";

export interface ShiftTemplate {
  /** Single character used in the grid and the share link. */
  code: string;
  label: string;
  /** 24-hour "HH:MM". */
  start: string;
  end: string;
  breakMinutes: number;
}

export interface Employee {
  id: string;
  name: string;
  hourlyRate: number;
  /** One template code per day, or OFF. Length matches the day count. */
  days: string[];
}

export interface ShiftHours {
  template: ShiftTemplate;
  /** Null when the times cannot be read. */
  minutes: number | null;
  crossesMidnight: boolean;
  breakTooLong: boolean;
}

const MINUTES_PER_DAY = 1440;

/** Paid minutes in one shift, after the unpaid break. */
export function shiftHours(template: ShiftTemplate): ShiftHours {
  const start = parseClock(template.start);
  const end = parseClock(template.end);
  if (start === null || end === null) {
    return {
      template,
      minutes: null,
      crossesMidnight: false,
      breakTooLong: false,
    };
  }
  const crossesMidnight = end <= start;
  const span = crossesMidnight ? end + MINUTES_PER_DAY - start : end - start;
  const brk = Math.max(template.breakMinutes, 0);
  return {
    template,
    minutes: Math.max(span - brk, 0),
    crossesMidnight,
    breakTooLong: span - brk < 0,
  };
}

export interface EmployeeWeek {
  /** 0-based index of the seven-day block from the schedule start. */
  index: number;
  minutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
}

export interface EmployeeTotals {
  employee: Employee;
  /** Paid minutes for each day of the schedule. */
  dayMinutes: number[];
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  weeks: EmployeeWeek[];
  regularPay: number;
  overtimePay: number;
  pay: number;
  shiftsWorked: number;
  daysOff: number;
}

export interface DayTotals {
  /** ISO date for this column. */
  date: string;
  minutes: number;
  headcount: number;
}

export interface ScheduleResult {
  employees: EmployeeTotals[];
  days: DayTotals[];
  totalMinutes: number;
  overtimeMinutes: number;
  totalCost: number;
  /** How many people are rostered at all. */
  staffed: number;
}

export function scheduleDates(startDate: string, dayCount: number): string[] {
  const base = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return Array.from({ length: dayCount }, () => "");
  return Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : WEEKDAYS[d.getUTCDay()];
}

export function computeSchedule(
  employees: Employee[],
  templates: ShiftTemplate[],
  startDate: string,
  dayCount: number,
  weeklyOvertimeThresholdHours: number,
  overtimeMultiplier: number,
): ScheduleResult {
  const byCode = new Map(templates.map((t) => [t.code, shiftHours(t)]));
  const dates = scheduleDates(startDate, dayCount);
  const thresholdMinutes = Math.max(weeklyOvertimeThresholdHours, 0) * 60;

  const employeeTotals: EmployeeTotals[] = employees.map((employee) => {
    const dayMinutes = Array.from({ length: dayCount }, (_, d) => {
      const code = employee.days[d] ?? OFF;
      if (code === OFF) return 0;
      return byCode.get(code)?.minutes ?? 0;
    });

    // Weeks run in blocks of seven from the schedule start — see the note at
    // the top of this file.
    const weeks: EmployeeWeek[] = [];
    for (let start = 0; start < dayCount; start += 7) {
      const minutes = dayMinutes
        .slice(start, start + 7)
        .reduce((s, m) => s + m, 0);
      const regularMinutes =
        thresholdMinutes > 0 ? Math.min(minutes, thresholdMinutes) : minutes;
      weeks.push({
        index: start / 7,
        minutes,
        regularMinutes,
        overtimeMinutes: minutes - regularMinutes,
      });
    }

    const totalMinutes = dayMinutes.reduce((s, m) => s + m, 0);
    const regularMinutes = weeks.reduce((s, w) => s + w.regularMinutes, 0);
    const overtimeMinutes = weeks.reduce((s, w) => s + w.overtimeMinutes, 0);
    const regularPay = (regularMinutes / 60) * employee.hourlyRate;
    const overtimePay =
      (overtimeMinutes / 60) * employee.hourlyRate * overtimeMultiplier;

    return {
      employee,
      dayMinutes,
      totalMinutes,
      regularMinutes,
      overtimeMinutes,
      weeks,
      regularPay,
      overtimePay,
      pay: regularPay + overtimePay,
      shiftsWorked: dayMinutes.filter((m) => m > 0).length,
      daysOff: dayMinutes.filter((m) => m === 0).length,
    };
  });

  const days: DayTotals[] = Array.from({ length: dayCount }, (_, d) => ({
    date: dates[d] ?? "",
    minutes: employeeTotals.reduce((s, e) => s + e.dayMinutes[d], 0),
    headcount: employeeTotals.filter((e) => e.dayMinutes[d] > 0).length,
  }));

  return {
    employees: employeeTotals,
    days,
    totalMinutes: employeeTotals.reduce((s, e) => s + e.totalMinutes, 0),
    overtimeMinutes: employeeTotals.reduce((s, e) => s + e.overtimeMinutes, 0),
    totalCost: employeeTotals.reduce((s, e) => s + e.pay, 0),
    staffed: employeeTotals.filter((e) => e.totalMinutes > 0).length,
  };
}

/* ---------------------------------------------------------------- */
/* Export                                                            */
/* ---------------------------------------------------------------- */

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A spreadsheet-ready roster: one row per person, one column per day. */
export function toCsv(
  result: ScheduleResult,
  templates: ShiftTemplate[],
  dates: string[],
): string {
  const byCode = new Map(templates.map((t) => [t.code, t]));
  const header = [
    "Employee",
    "Rate",
    ...dates.map((d) => `${weekdayOf(d)} ${d}`),
    "Hours",
    "Overtime",
    "Pay",
  ];

  const rows = result.employees.map((e) => [
    e.employee.name,
    e.employee.hourlyRate.toFixed(2),
    ...e.employee.days.map((code, i) => {
      if (code === OFF || e.dayMinutes[i] === 0) return "";
      const t = byCode.get(code);
      return t ? `${t.label} ${t.start}-${t.end}` : code;
    }),
    (e.totalMinutes / 60).toFixed(2),
    (e.overtimeMinutes / 60).toFixed(2),
    e.pay.toFixed(2),
  ]);

  const footer = [
    "Total",
    "",
    ...result.days.map((d) => (d.minutes / 60).toFixed(2)),
    (result.totalMinutes / 60).toFixed(2),
    (result.overtimeMinutes / 60).toFixed(2),
    result.totalCost.toFixed(2),
  ];

  return [header, ...rows, footer]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}
