import { describe, expect, it } from "vitest";

import {
  computeTimeCard,
  parseClock,
  parseDay,
  weekStartOf,
  type TimeCardEntry,
} from "./timecard";

const entry = (
  date: string,
  start: string,
  end: string,
  breakMinutes = 0,
): TimeCardEntry => ({ id: date + start, date, start, end, breakMinutes });

describe("parseClock", () => {
  it("reads the forms people type", () => {
    expect(parseClock("09:00")).toBe(540);
    expect(parseClock("9:00")).toBe(540);
    expect(parseClock("9.00")).toBe(540);
    expect(parseClock("22:30")).toBe(1350);
    expect(parseClock("00:00")).toBe(0);
  });

  it("rejects impossible clock times", () => {
    expect(parseClock("25:00")).toBeNull();
    expect(parseClock("12:75")).toBeNull();
    expect(parseClock("lunch")).toBeNull();
    expect(parseClock("")).toBeNull();
  });
});

describe("cross-midnight — documented decision 1", () => {
  it("treats an end at or before the start as the next day", () => {
    const d = parseDay(entry("2026-03-02", "22:00", "06:00"));
    expect(d.crossedMidnight).toBe(true);
    expect(d.workedMinutes).toBe(480);
  });

  it("does not invent a negative shift", () => {
    const d = parseDay(entry("2026-03-02", "23:30", "07:15"));
    expect(d.workedMinutes).toBe(465);
    expect(d.workedMinutes).toBeGreaterThan(0);
  });

  it("leaves a normal day alone", () => {
    const d = parseDay(entry("2026-03-02", "09:00", "17:00"));
    expect(d.crossedMidnight).toBe(false);
    expect(d.workedMinutes).toBe(480);
  });

  it("treats identical times as a full 24 hours, flagged as crossing", () => {
    const d = parseDay(entry("2026-03-02", "09:00", "09:00"));
    expect(d.crossedMidnight).toBe(true);
    expect(d.workedMinutes).toBe(1440);
  });
});

describe("break deduction", () => {
  it("subtracts the unpaid break", () => {
    const d = parseDay(entry("2026-03-02", "09:00", "17:30", 30));
    expect(d.workedMinutes).toBe(480);
  });

  it("clamps at zero and flags a break longer than the shift", () => {
    const d = parseDay(entry("2026-03-02", "09:00", "10:00", 90));
    expect(d.workedMinutes).toBe(0);
    expect(d.breakTooLong).toBe(true);
  });

  it("ignores a negative break rather than paying extra", () => {
    const d = parseDay(entry("2026-03-02", "09:00", "17:00", -60));
    expect(d.workedMinutes).toBe(480);
  });

  it("reports null for an unreadable row rather than zero", () => {
    const d = parseDay(entry("2026-03-02", "oops", "17:00"));
    expect(d.workedMinutes).toBeNull();
  });
});

describe("weekStartOf", () => {
  it("finds the Sunday of the week", () => {
    // 2026-03-04 is a Wednesday.
    expect(weekStartOf("2026-03-04", "sunday")).toBe("2026-03-01");
  });

  it("finds the Monday of the week", () => {
    expect(weekStartOf("2026-03-04", "monday")).toBe("2026-03-02");
  });

  it("leaves a day that is already the week start alone", () => {
    expect(weekStartOf("2026-03-01", "sunday")).toBe("2026-03-01");
    expect(weekStartOf("2026-03-02", "monday")).toBe("2026-03-02");
  });
});

describe("overtime is weekly, never per card — documented decision 2", () => {
  // Week 1 (Mar 1–7): five 10-hour days = 50 h.
  // Week 2 (Mar 8–14): three 10-hour days = 30 h.
  const twoWeeks: TimeCardEntry[] = [
    entry("2026-03-02", "08:00", "18:00"),
    entry("2026-03-03", "08:00", "18:00"),
    entry("2026-03-04", "08:00", "18:00"),
    entry("2026-03-05", "08:00", "18:00"),
    entry("2026-03-06", "08:00", "18:00"),
    entry("2026-03-09", "08:00", "18:00"),
    entry("2026-03-10", "08:00", "18:00"),
    entry("2026-03-11", "08:00", "18:00"),
  ];

  it("charges overtime in the heavy week even though the card averages 40", () => {
    const r = computeTimeCard(twoWeeks, 20, 40, 1.5, "sunday");
    expect(r.totalMinutes / 60).toBe(80);
    // Averaging over the card would give zero overtime. It must be ten hours.
    expect(r.overtimeMinutes / 60).toBe(10);
    expect(r.regularMinutes / 60).toBe(70);
  });

  it("splits the two weeks correctly", () => {
    const r = computeTimeCard(twoWeeks, 20, 40, 1.5, "sunday");
    expect(r.weeks).toHaveLength(2);
    expect(r.weeks[0].totalMinutes / 60).toBe(50);
    expect(r.weeks[0].overtimeMinutes / 60).toBe(10);
    expect(r.weeks[1].totalMinutes / 60).toBe(30);
    expect(r.weeks[1].overtimeMinutes / 60).toBe(0);
  });

  it("prices overtime at the multiplier", () => {
    const r = computeTimeCard(twoWeeks, 20, 40, 1.5, "sunday");
    expect(r.regularPay).toBe(70 * 20);
    expect(r.overtimePay).toBe(10 * 20 * 1.5);
    expect(r.totalPay).toBe(1400 + 300);
  });

  it("pays everything at the plain rate when the threshold is zero", () => {
    const r = computeTimeCard(twoWeeks, 20, 0, 1.5, "sunday");
    expect(r.overtimeMinutes).toBe(0);
    expect(r.totalPay).toBe(80 * 20);
  });

  it("moves hours between weeks when the week start changes", () => {
    // A Sunday shift belongs to a different week under each convention.
    const sundayShift = [
      entry("2026-03-01", "08:00", "18:00"), // Sunday
      entry("2026-03-02", "08:00", "18:00"), // Monday
    ];
    const bySunday = computeTimeCard(sundayShift, 20, 40, 1.5, "sunday");
    const byMonday = computeTimeCard(sundayShift, 20, 40, 1.5, "monday");
    expect(bySunday.weeks).toHaveLength(1);
    expect(byMonday.weeks).toHaveLength(2);
  });
});

describe("time card totals", () => {
  it("skips unreadable rows without breaking the total", () => {
    const r = computeTimeCard(
      [
        entry("2026-03-02", "09:00", "17:00"),
        entry("2026-03-03", "???", "17:00"),
      ],
      20,
      40,
      1.5,
      "sunday",
    );
    expect(r.totalMinutes / 60).toBe(8);
    expect(Number.isFinite(r.totalPay)).toBe(true);
  });

  it("handles an empty card", () => {
    const r = computeTimeCard([], 20, 40, 1.5, "sunday");
    expect(r.totalPay).toBe(0);
    expect(r.weeks).toHaveLength(0);
  });
});
