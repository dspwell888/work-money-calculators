import { describe, expect, it } from "vitest";

import {
  computeBillable,
  computeNannyPay,
  computeShifts,
  parseDuration,
  roundUpMinutes,
  type BillableEntry,
  type Shift,
} from "./billing";

/* ---------------------------------------------------------------- */

describe("roundUpMinutes — always up, never nearest", () => {
  it("bills a whole increment for any part of one", () => {
    expect(roundUpMinutes(1, "15")).toBe(15);
    expect(roundUpMinutes(14, "15")).toBe(15);
    expect(roundUpMinutes(16, "15")).toBe(30);
  });

  it("leaves an exact multiple alone", () => {
    expect(roundUpMinutes(30, "15")).toBe(30);
    expect(roundUpMinutes(12, "6")).toBe(12);
  });

  it("handles the six-minute tenth-hour increment", () => {
    expect(roundUpMinutes(1, "6")).toBe(6);
    expect(roundUpMinutes(7, "6")).toBe(12);
  });

  it("bills nothing for no time", () => {
    expect(roundUpMinutes(0, "15")).toBe(0);
    expect(roundUpMinutes(-5, "15")).toBe(0);
  });
});

describe("computeBillable", () => {
  const entries: BillableEntry[] = [
    { id: "a", task: "Call", minutes: 5 },
    { id: "b", task: "Draft", minutes: 95 },
    { id: "c", task: "Review", minutes: 20 },
  ];

  it("rounds each line up before totalling", () => {
    // 5→15, 95→105, 20→30 = 150 min = 2.5 h
    const r = computeBillable(entries, "15", 200);
    expect(r.lines.map((l) => l.billedMinutes)).toEqual([15, 105, 30]);
    expect(r.billedHours).toBe(2.5);
    expect(r.total).toBe(500);
  });

  it("reports the uplift the rounding rule creates", () => {
    const r = computeBillable(entries, "15", 200);
    // Raw is 120 min = 2 h; billed is 2.5 h.
    expect(r.rawHours).toBe(2);
    expect(r.upliftHours).toBe(0.5);
  });

  it("bills less on a finer increment", () => {
    const coarse = computeBillable(entries, "15", 200);
    const fine = computeBillable(entries, "6", 200);
    expect(fine.total).toBeLessThan(coarse.total);
    // 6→6, 96→96, 20→24 = 126 min = 2.1 h
    expect(fine.billedHours).toBeCloseTo(2.1, 9);
  });

  it("charges actual minutes on the 1-minute increment", () => {
    const r = computeBillable(entries, "1", 60);
    expect(r.billedHours).toBe(2);
    expect(r.upliftHours).toBe(0);
  });

  it("handles an empty sheet without NaN", () => {
    const r = computeBillable([], "15", 200);
    expect(r.total).toBe(0);
    expect(r.billedHours).toBe(0);
    expect(Number.isFinite(r.upliftHours)).toBe(true);
  });
});

describe("parseDuration", () => {
  const cases: [string, number][] = [
    ["1:30", 90],
    ["1.5", 90],
    ["90m", 90],
    ["1h30", 90],
    ["1 h 30 m", 90],
    ["45min", 45],
    ["2", 120],
  ];
  it.each(cases)("parses %s", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it("rejects nonsense rather than counting it as zero", () => {
    expect(parseDuration("lunch")).toBeNull();
    expect(parseDuration("")).toBeNull();
  });
});

/* ---------------------------------------------------------------- */

describe("computeNannyPay", () => {
  const base = {
    hourlyRate: 20,
    regularHours: 30,
    overtimeHours: 0,
    overtimeMultiplier: 1.5,
    extraChildren: 0,
    perExtraChildRate: 2,
    extras: 0,
  };

  it("multiplies rate by hours", () => {
    const r = computeNannyPay(base);
    expect(r.total).toBe(600);
    expect(r.effectiveRate).toBe(20);
  });

  it("adds a per-child uplift to the base rate", () => {
    const r = computeNannyPay({ ...base, extraChildren: 2 });
    expect(r.effectiveRate).toBe(24);
    expect(r.total).toBe(720);
  });

  it("applies overtime to the uplifted rate, not the headline rate", () => {
    const r = computeNannyPay({
      ...base,
      extraChildren: 1,
      overtimeHours: 4,
    });
    // 22/h base, 33/h overtime
    expect(r.effectiveRate).toBe(22);
    expect(r.overtimeRate).toBe(33);
    expect(r.overtimePay).toBe(132);
    expect(r.total).toBe(22 * 30 + 132);
  });

  it("adds flat extras on top", () => {
    const r = computeNannyPay({ ...base, extras: 25 });
    expect(r.total).toBe(625);
  });

  it("blends the rate across all hours", () => {
    const r = computeNannyPay({ ...base, overtimeHours: 10 });
    expect(r.totalHours).toBe(40);
    expect(r.blendedRate).toBeCloseTo((600 + 300) / 40, 9);
  });

  it("does not divide by zero with no hours", () => {
    const r = computeNannyPay({ ...base, regularHours: 0 });
    expect(r.blendedRate).toBe(0);
  });
});

/* ---------------------------------------------------------------- */

describe("computeShifts", () => {
  const shifts: Shift[] = [
    { id: "d", name: "Day", hours: 24, differential: 0 },
    { id: "e", name: "Evening", hours: 8, differential: 10 },
    { id: "n", name: "Night", hours: 8, differential: 15 },
  ];

  it("applies a percentage differential per shift", () => {
    const r = computeShifts(20, shifts, "percent");
    expect(r.lines[1].rate).toBe(22);
    expect(r.lines[2].rate).toBe(23);
    expect(r.basePay).toBe(800);
    expect(r.premiumPay).toBe(16 + 24);
    expect(r.total).toBe(840);
    expect(r.totalHours).toBe(40);
  });

  it("applies a flat differential per hour", () => {
    const r = computeShifts(20, shifts, "flat");
    // differential is dollars, not percent
    expect(r.lines[1].rate).toBe(30);
    expect(r.lines[2].rate).toBe(35);
    expect(r.premiumPay).toBe(10 * 8 + 15 * 8);
  });

  it("blends the rate across every shift", () => {
    const r = computeShifts(20, shifts, "percent");
    expect(r.blendedRate).toBeCloseTo(21, 9);
  });

  it("separates base pay from premium so the uplift is visible", () => {
    const r = computeShifts(20, shifts, "percent");
    expect(r.basePay + r.premiumPay).toBe(r.total);
  });

  it("does not divide by zero with no shifts", () => {
    const r = computeShifts(20, [], "percent");
    expect(r.blendedRate).toBe(0);
    expect(r.total).toBe(0);
  });
});
