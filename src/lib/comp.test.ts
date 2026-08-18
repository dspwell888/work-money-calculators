import { describe, expect, it } from "vitest";

import {
  computePrevailingWage,
  computeWageInflation,
  medianOf,
  percentileFromBreakpoints,
  percentileFromList,
  type Breakpoint,
} from "./comp";

/* ---------------------------------------------------------------- */

describe("percentileFromList", () => {
  const salaries = [50000, 60000, 70000, 80000, 90000];

  it("uses the mid-rank definition", () => {
    // Two below, one equal, two above → (2 + 0.5) / 5 = 50%.
    const r = percentileFromList(salaries, 70000)!;
    expect(r.percentile).toBe(50);
    expect(r.below).toBe(2);
    expect(r.equal).toBe(1);
    expect(r.above).toBe(2);
  });

  it("does not put the lowest member at exactly zero", () => {
    const r = percentileFromList(salaries, 50000)!;
    expect(r.percentile).toBe(10);
    expect(r.percentile).toBeGreaterThan(0);
  });

  it("places a salary outside the set at the extremes", () => {
    expect(percentileFromList(salaries, 10000)!.percentile).toBe(0);
    expect(percentileFromList(salaries, 200000)!.percentile).toBe(100);
  });

  it("halves ties rather than favouring one side", () => {
    const withTies = [60000, 70000, 70000, 80000];
    const r = percentileFromList(withTies, 70000)!;
    // one below + half of two equal = 2 / 4 = 50%
    expect(r.percentile).toBe(50);
  });

  it("reports the median and compa-ratio", () => {
    const r = percentileFromList(salaries, 84000)!;
    expect(r.median).toBe(70000);
    expect(r.compaRatio).toBeCloseTo(1.2, 9);
  });

  it("handles an unsorted list", () => {
    const shuffled = [90000, 50000, 80000, 60000, 70000];
    expect(percentileFromList(shuffled, 70000)!.percentile).toBe(50);
  });

  it("returns null for an empty set rather than NaN", () => {
    expect(percentileFromList([], 50000)).toBeNull();
    expect(percentileFromList([NaN], 50000)).toBeNull();
  });
});

describe("medianOf", () => {
  it("averages the middle pair on an even count", () => {
    expect(medianOf([10, 20, 30, 40])).toBe(25);
  });
  it("takes the middle on an odd count", () => {
    expect(medianOf([10, 20, 30])).toBe(20);
  });
  it("returns zero for an empty list", () => {
    expect(medianOf([])).toBe(0);
  });
});

/* ---------------------------------------------------------------- */

describe("percentileFromBreakpoints", () => {
  const survey: Breakpoint[] = [
    { id: "a", percentile: 25, salary: 60000 },
    { id: "b", percentile: 50, salary: 75000 },
    { id: "c", percentile: 75, salary: 92000 },
    { id: "d", percentile: 90, salary: 110000 },
  ];

  it("returns a breakpoint's own percentile exactly", () => {
    expect(percentileFromBreakpoints(survey, 75000)!.percentile).toBe(50);
  });

  it("interpolates linearly between two breakpoints", () => {
    // Halfway between 60k and 75k → halfway between p25 and p50.
    const r = percentileFromBreakpoints(survey, 67500)!;
    expect(r.percentile).toBeCloseTo(37.5, 9);
    expect(r.lower!.percentile).toBe(25);
    expect(r.upper!.percentile).toBe(50);
    expect(r.clamped).toBe(false);
  });

  it("clamps above the top breakpoint rather than extrapolating", () => {
    // A survey stopping at p90 says nothing about p97.
    const r = percentileFromBreakpoints(survey, 200000)!;
    expect(r.percentile).toBe(90);
    expect(r.clamped).toBe(true);
  });

  it("clamps below the bottom breakpoint", () => {
    const r = percentileFromBreakpoints(survey, 30000)!;
    expect(r.percentile).toBe(25);
    expect(r.clamped).toBe(true);
  });

  it("does not flag a salary sitting exactly on an end breakpoint", () => {
    expect(percentileFromBreakpoints(survey, 60000)!.clamped).toBe(false);
    expect(percentileFromBreakpoints(survey, 110000)!.clamped).toBe(false);
  });

  it("computes compa-ratio against the p50 breakpoint", () => {
    const r = percentileFromBreakpoints(survey, 90000)!;
    expect(r.median).toBe(75000);
    expect(r.compaRatio).toBeCloseTo(1.2, 9);
  });

  it("sorts breakpoints given out of order", () => {
    const shuffled = [survey[2], survey[0], survey[3], survey[1]];
    expect(percentileFromBreakpoints(shuffled, 67500)!.percentile).toBeCloseTo(
      37.5,
      9,
    );
  });

  it("returns null with no breakpoints", () => {
    expect(percentileFromBreakpoints([], 50000)).toBeNull();
  });
});

/* ---------------------------------------------------------------- */

describe("computeWageInflation", () => {
  const base = {
    startSalary: 60000,
    endSalary: 70000,
    years: 5,
    annualInflationPercent: 3,
  };

  it("discounts the end salary back to start-year money", () => {
    const r = computeWageInflation(base);
    // 1.03^5 = 1.159274
    expect(r.realEndSalary).toBeCloseTo(70000 / 1.159274, 2);
    expect(r.realEndSalary).toBeLessThan(70000);
  });

  it("beats inflation only just, when 16.7% nominal meets 15.9% cumulative", () => {
    const r = computeWageInflation(base);
    expect(r.nominalChange).toBe(10000);
    expect(r.nominalChangePercent).toBeCloseTo(16.667, 3);
    // The margin is under one percentage point — a real but tiny gain.
    expect(r.realChange).toBeGreaterThan(0);
    expect(r.realChangePercent).toBeLessThan(1);
  });

  it("shows a nominal rise that is a real fall when inflation outruns it", () => {
    const r = computeWageInflation({ ...base, annualInflationPercent: 5 });
    expect(r.nominalChange).toBe(10000);
    expect(r.realChange).toBeLessThan(0);
    expect(r.realChangePercent).toBeLessThan(0);
    expect(r.shortfall).toBeLessThan(0);
  });

  it("reports the break-even salary and the margin against it", () => {
    const r = computeWageInflation(base);
    expect(r.breakEvenSalary).toBeCloseTo(60000 * 1.159274, 2);
    expect(r.shortfall).toBeCloseTo(70000 - 60000 * 1.159274, 2);
    // Sign of the shortfall must agree with the sign of the real change.
    expect(Math.sign(r.shortfall)).toBe(Math.sign(r.realChange));
  });

  it("gives zero real change when pay exactly tracks inflation", () => {
    const r = computeWageInflation({
      ...base,
      endSalary: 60000 * Math.pow(1.03, 5),
    });
    expect(r.realChange).toBeCloseTo(0, 6);
    expect(r.shortfall).toBeCloseTo(0, 6);
    expect(r.realCagrPercent).toBeCloseTo(0, 6);
  });

  it("computes nominal and real compound growth", () => {
    const r = computeWageInflation(base);
    expect(r.nominalCagrPercent).toBeCloseTo(
      (Math.pow(70000 / 60000, 1 / 5) - 1) * 100,
      6,
    );
    expect(r.realCagrPercent).toBeLessThan(r.nominalCagrPercent);
  });

  it("reports cumulative inflation over the period", () => {
    const r = computeWageInflation(base);
    expect(r.cumulativeInflationPercent).toBeCloseTo(15.9274, 3);
  });

  it("handles zero inflation as a pure nominal comparison", () => {
    const r = computeWageInflation({ ...base, annualInflationPercent: 0 });
    expect(r.realEndSalary).toBe(70000);
    expect(r.realChange).toBe(10000);
    expect(r.cumulativeInflationPercent).toBe(0);
  });

  it("does not divide by zero on a zero start or zero years", () => {
    const zeroStart = computeWageInflation({ ...base, startSalary: 0 });
    expect(zeroStart.realChangePercent).toBe(0);
    expect(zeroStart.nominalCagrPercent).toBe(0);
    const zeroYears = computeWageInflation({ ...base, years: 0 });
    expect(Number.isFinite(zeroYears.realEndSalary)).toBe(true);
    expect(zeroYears.nominalCagrPercent).toBe(0);
  });
});

/* ---------------------------------------------------------------- */

describe("computePrevailingWage", () => {
  const base = {
    baseRate: 35,
    fringeRate: 12,
    fringeCreditPerHour: 0,
    regularHours: 40,
    overtimeHours: 0,
    overtimeMultiplier: 1.5,
  };

  it("pays base plus the full fringe in cash when no benefits are provided", () => {
    const r = computePrevailingWage(base);
    expect(r.regularPay).toBe(1400);
    expect(r.fringeCashOwed).toBe(480);
    expect(r.totalCashDue).toBe(1880);
    expect(r.effectiveCashRate).toBe(47);
  });

  it("credits benefits actually provided against the fringe owed", () => {
    const r = computePrevailingWage({ ...base, fringeCreditPerHour: 8 });
    expect(r.fringeShortfallPerHour).toBe(4);
    expect(r.fringeCashOwed).toBe(160);
    expect(r.fringeCreditValue).toBe(320);
    expect(r.totalCashDue).toBe(1560);
    // The package is unchanged — only the cash/benefit mix moves.
    expect(r.totalPackage).toBe(1880);
  });

  it("never owes negative cash when benefits exceed the fringe rate", () => {
    const r = computePrevailingWage({ ...base, fringeCreditPerHour: 20 });
    expect(r.fringeShortfallPerHour).toBe(0);
    expect(r.fringeCashOwed).toBe(0);
    // Credit is capped at the fringe rate, not the amount actually spent.
    expect(r.fringeCreditValue).toBe(480);
  });

  it("applies the overtime multiplier to the base rate only", () => {
    const r = computePrevailingWage({ ...base, overtimeHours: 10 });
    // 35 × 1.5 × 10 — not (35 + 12) × 1.5 × 10.
    expect(r.overtimePay).toBe(525);
    expect(r.overtimePay).not.toBe(47 * 1.5 * 10);
  });

  it("owes fringe at straight time on overtime hours too", () => {
    const r = computePrevailingWage({ ...base, overtimeHours: 10 });
    expect(r.totalHours).toBe(50);
    // 12 × 50, including the overtime hours.
    expect(r.fringeCashOwed).toBe(600);
  });

  it("totals a week with overtime correctly", () => {
    const r = computePrevailingWage({ ...base, overtimeHours: 10 });
    expect(r.totalCashDue).toBe(1400 + 525 + 600);
    expect(r.effectiveCashRate).toBeCloseTo(2525 / 50, 9);
  });

  it("does not divide by zero on an empty week", () => {
    const r = computePrevailingWage({
      ...base,
      regularHours: 0,
      overtimeHours: 0,
    });
    expect(r.effectiveCashRate).toBe(0);
    expect(r.totalCashDue).toBe(0);
  });
});
