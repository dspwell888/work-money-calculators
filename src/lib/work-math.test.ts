import { describe, expect, it } from "vitest";

import {
  computeCommission,
  computeHourlySalary,
  computeOvertime,
  proRataByHours,
  proRataByTerm,
  salaryToHourly,
  type CommissionBracket,
  type OvertimeTier,
} from "./work-math";

/* ---------------------------------------------------------------- */

describe("pro rata by hours", () => {
  it("scales a full-time salary by contracted hours", () => {
    expect(
      proRataByHours({
        fullTimeSalary: 50000,
        fullTimeHours: 40,
        actualHours: 24,
      }),
    ).toBe(30000);
  });

  it("returns the full salary at full hours", () => {
    expect(
      proRataByHours({
        fullTimeSalary: 50000,
        fullTimeHours: 40,
        actualHours: 40,
      }),
    ).toBe(50000);
  });

  it("does not divide by zero when full-time hours are blank", () => {
    expect(
      proRataByHours({
        fullTimeSalary: 50000,
        fullTimeHours: 0,
        actualHours: 24,
      }),
    ).toBe(0);
  });
});

describe("pro rata by term", () => {
  it("scales by months served", () => {
    expect(proRataByTerm(50000, 7, "months")).toBeCloseTo(29166.67, 2);
  });

  it("scales by weeks and days", () => {
    expect(proRataByTerm(52000, 26, "weeks")).toBe(26000);
    expect(proRataByTerm(36500, 100, "days")).toBeCloseTo(10000, 6);
  });

  it("returns the whole salary for a full year", () => {
    expect(proRataByTerm(50000, 12, "months")).toBe(50000);
  });
});

/* ---------------------------------------------------------------- */

const tier = (hours: number, multiplier: number, i = 0): OvertimeTier => ({
  id: `t${i}`,
  hours,
  multiplier,
});

describe("overtime", () => {
  it("prices time and a half", () => {
    const r = computeOvertime(22, 40, [tier(8, 1.5)]);
    expect(r.regularPay).toBe(880);
    expect(r.tiers[0].rate).toBe(33);
    expect(r.overtimePay).toBe(264);
    expect(r.totalPay).toBe(1144);
    expect(r.totalHours).toBe(48);
    expect(r.blendedRate).toBeCloseTo(23.8333, 4);
  });

  it("splits a week across two multipliers", () => {
    const r = computeOvertime(22, 40, [tier(10, 1.5, 0), tier(6, 2, 1)]);
    expect(r.tiers[0].pay).toBe(330);
    expect(r.tiers[1].pay).toBe(264);
    expect(r.overtimePay).toBe(594);
    expect(r.totalPay).toBe(1474);
    expect(r.totalHours).toBe(56);
    expect(r.blendedRate).toBeCloseTo(26.3214, 4);
  });

  it("applies the multiplier to the base rate, never to a blended rate", () => {
    const r = computeOvertime(20, 40, [tier(10, 1.5)]);
    // 1.5 × 20, not 1.5 × the week's average.
    expect(r.tiers[0].rate).toBe(30);
  });

  it("handles a week with no overtime", () => {
    const r = computeOvertime(25, 40, []);
    expect(r.overtimePay).toBe(0);
    expect(r.totalPay).toBe(1000);
    expect(r.blendedRate).toBe(25);
  });

  it("does not divide by zero on an empty week", () => {
    const r = computeOvertime(25, 0, []);
    expect(r.blendedRate).toBe(0);
    expect(Number.isFinite(r.blendedRate)).toBe(true);
  });
});

/* ---------------------------------------------------------------- */

const brackets: CommissionBracket[] = [
  { id: "b0", from: 0, ratePercent: 3 },
  { id: "b1", from: 100000, ratePercent: 5 },
  { id: "b2", from: 250000, ratePercent: 8 },
];

describe("commission", () => {
  it("pays each band at its own rate, not the top rate on everything", () => {
    const r = computeCommission(300000, brackets, 60000);
    expect(r.slices.map((s) => s.commission)).toEqual([3000, 7500, 4000]);
    expect(r.commission).toBe(14500);
    // The whole point: 14,500 is not 8% of 300,000.
    expect(r.commission).not.toBe(24000);
    expect(r.effectiveRate).toBeCloseTo(4.8333, 4);
    expect(r.total).toBe(74500);
  });

  it("stops at the band the sales reach", () => {
    const r = computeCommission(150000, brackets, 0);
    expect(r.slices).toHaveLength(2);
    expect(r.commission).toBe(3000 + 2500);
  });

  it("handles a flat rate as a single band", () => {
    const r = computeCommission(
      250000,
      [{ id: "flat", from: 0, ratePercent: 5 }],
      0,
    );
    expect(r.commission).toBe(12500);
    expect(r.effectiveRate).toBeCloseTo(5, 9);
  });

  it("sorts brackets that arrive out of order", () => {
    const shuffled = [brackets[2], brackets[0], brackets[1]];
    expect(computeCommission(300000, shuffled, 0).commission).toBe(14500);
  });

  it("pays nothing on zero sales without producing NaN", () => {
    const r = computeCommission(0, brackets, 40000);
    expect(r.commission).toBe(0);
    expect(r.effectiveRate).toBe(0);
    expect(r.total).toBe(40000);
  });

  it("never lets the effective rate exceed the top band", () => {
    const r = computeCommission(1_000_000, brackets, 0);
    expect(r.effectiveRate).toBeLessThan(8);
  });
});

/* ---------------------------------------------------------------- */

const base = {
  hourlyRate: 25,
  hoursPerWeek: 40,
  weeksPerYear: 52,
  overtimeHours: 0,
  overtimeMultiplier: 1.5,
  unpaidDaysOff: 0,
};

describe("hourly to salary", () => {
  it("converts a standard full-time year", () => {
    const r = computeHourlySalary(base);
    expect(r.annual).toBe(52000);
    expect(r.monthly).toBeCloseTo(4333.33, 2);
    expect(r.biweekly).toBe(2000);
    expect(r.weekly).toBe(1000);
    expect(r.daily).toBe(200);
    expect(r.paidHoursPerYear).toBe(2080);
  });

  it("adds overtime and reports it separately", () => {
    const r = computeHourlySalary({ ...base, overtimeHours: 5 });
    // 25 × 1.5 × 5 × 52
    expect(r.overtimeAnnual).toBe(9750);
    expect(r.annual).toBe(61750);
    expect(r.regularAnnual).toBe(52000);
  });

  it("subtracts genuinely unpaid days", () => {
    // 10 unpaid days = 2 weeks → 50 paid weeks
    const r = computeHourlySalary({ ...base, unpaidDaysOff: 10 });
    expect(r.annual).toBe(50000);
  });

  it("never goes below zero paid weeks", () => {
    const r = computeHourlySalary({ ...base, unpaidDaysOff: 1000 });
    expect(r.annual).toBe(0);
    expect(Number.isFinite(r.weekly)).toBe(true);
    expect(Number.isFinite(r.biweekly)).toBe(true);
  });

  it("round-trips against salaryToHourly", () => {
    const hourly = salaryToHourly(52000, 40, 52);
    expect(hourly).toBe(25);
    expect(computeHourlySalary({ ...base, hourlyRate: hourly }).annual).toBe(
      52000,
    );
  });

  it("round-trips salary to hourly with regular overtime", () => {
    const annual = 61750; // $25 × (40 + 5 × 1.5) × 52
    const hourly = salaryToHourly(annual, 40, 52, {
      overtimeHours: 5,
      overtimeMultiplier: 1.5,
    });
    expect(hourly).toBe(25);
    expect(
      computeHourlySalary({ ...base, hourlyRate: hourly, overtimeHours: 5 })
        .annual,
    ).toBe(annual);
  });

  it("round-trips salary to hourly after unpaid days", () => {
    const hourly = salaryToHourly(52000, 40, 52, { unpaidDaysOff: 10 });
    expect(hourly).toBe(26); // $52,000 over 2,000 paid hours
    expect(
      computeHourlySalary({ ...base, hourlyRate: hourly, unpaidDaysOff: 10 })
        .annual,
    ).toBe(52000);
  });

  it("does not divide by zero with no hours", () => {
    expect(salaryToHourly(52000, 0, 52)).toBe(0);
    expect(salaryToHourly(52000, 40, 0)).toBe(0);
  });
});
