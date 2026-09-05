import { describe, expect, it } from "vitest";

import {
  computeCommissionSplit,
  computeEmployeeCost,
  computeFreelanceRate,
  computeRetroPay,
} from "./rates";

/* ---------------------------------------------------------------- */

describe("retro pay — hourly", () => {
  it("pays the difference on every hour worked at the old rate", () => {
    const r = computeRetroPay({
      basis: "hourly",
      oldRate: 20,
      newRate: 22.5,
      hours: 320,
      periods: 0,
      periodsPerYear: 26,
    });
    expect(r.differencePerUnit).toBe(2.5);
    expect(r.backPay).toBe(800);
    expect(r.increasePercent).toBeCloseTo(12.5, 9);
  });

  it("returns a negative figure rather than hiding a rate cut", () => {
    const r = computeRetroPay({
      basis: "hourly",
      oldRate: 22,
      newRate: 20,
      hours: 100,
      periods: 0,
      periodsPerYear: 26,
    });
    expect(r.backPay).toBe(-200);
  });

  it("does not divide by zero on a zero old rate", () => {
    const r = computeRetroPay({
      basis: "hourly",
      oldRate: 0,
      newRate: 20,
      hours: 10,
      periods: 0,
      periodsPerYear: 26,
    });
    expect(r.increasePercent).toBe(0);
    expect(r.backPay).toBe(200);
  });
});

describe("retro pay — salary", () => {
  it("pays the per-period difference for each underpaid period", () => {
    // 60,000 → 63,000 over 26 periods is $115.38 a period; 5 periods late.
    const r = computeRetroPay({
      basis: "salary",
      oldRate: 60000,
      newRate: 63000,
      hours: 0,
      periods: 5,
      periodsPerYear: 26,
    });
    expect(r.differencePerUnit).toBeCloseTo(115.3846, 4);
    expect(r.backPay).toBeCloseTo(576.923, 3);
    expect(r.increasePercent).toBeCloseTo(5, 9);
  });

  it("falls back to 26 periods rather than dividing by zero", () => {
    const r = computeRetroPay({
      basis: "salary",
      oldRate: 60000,
      newRate: 63000,
      hours: 0,
      periods: 1,
      periodsPerYear: 0,
    });
    expect(Number.isFinite(r.backPay)).toBe(true);
    expect(r.differencePerUnit).toBeCloseTo(3000 / 26, 6);
  });
});

/* ---------------------------------------------------------------- */

describe("real-estate commission — documented split order", () => {
  const base = {
    salePrice: 500000,
    totalRatePercent: 5,
    listingSharePercent: 50,
    listingAgentSplitPercent: 60,
    buyingAgentSplitPercent: 60,
  };

  it("splits total, then sides, then each side's agent and brokerage", () => {
    const r = computeCommissionSplit(base);
    expect(r.totalCommission).toBe(25000);
    expect(r.listingSide).toBe(12500);
    expect(r.buyingSide).toBe(12500);
    expect(r.listingAgent).toBe(7500);
    expect(r.listingBrokerage).toBe(5000);
    expect(r.buyingAgent).toBe(7500);
    expect(r.buyingBrokerage).toBe(5000);
  });

  it("applies the brokerage split to one side only, never to the total", () => {
    const r = computeCommissionSplit(base);
    // The wrong order would give an agent 60% of 25,000 = 15,000.
    expect(r.listingAgent).not.toBe(15000);
    expect(r.listingAgent + r.listingBrokerage).toBe(r.listingSide);
  });

  it("every part adds back to the total", () => {
    const r = computeCommissionSplit(base);
    expect(
      r.listingAgent + r.listingBrokerage + r.buyingAgent + r.buyingBrokerage,
    ).toBe(r.totalCommission);
  });

  it("handles an uneven side split", () => {
    const r = computeCommissionSplit({ ...base, listingSharePercent: 60 });
    expect(r.listingSide).toBe(15000);
    expect(r.buyingSide).toBe(10000);
  });

  it("reports what the seller keeps and the effective rate", () => {
    const r = computeCommissionSplit(base);
    expect(r.netToSeller).toBe(475000);
    expect(r.effectiveRate).toBeCloseTo(5, 9);
  });

  it("does not divide by zero on a zero sale price", () => {
    const r = computeCommissionSplit({ ...base, salePrice: 0 });
    expect(r.effectiveRate).toBe(0);
    expect(r.totalCommission).toBe(0);
  });
});

/* ---------------------------------------------------------------- */

describe("freelance rate", () => {
  const base = {
    targetIncome: 80000,
    annualCosts: 10000,
    profitMarginPercent: 0,
    workingDays: 230,
    utilisationPercent: 70,
    hoursPerDay: 8,
  };

  it("prices from target income, costs, and billable days", () => {
    const r = computeFreelanceRate(base);
    expect(r.requiredRevenue).toBe(90000);
    expect(r.billableDays).toBeCloseTo(161, 9);
    expect(r.dayRate).toBeCloseTo(90000 / 161, 6);
    expect(r.hourlyRate).toBeCloseTo(90000 / (161 * 8), 6);
  });

  it("treats profit margin as a share of billed revenue, not a markup", () => {
    const r = computeFreelanceRate({ ...base, profitMarginPercent: 20 });
    expect(r.requiredRevenue).toBe(112500);
    expect((r.requiredRevenue - 90000) / r.requiredRevenue).toBeCloseTo(0.2, 9);
  });

  it("does not present a finite revenue at an impossible 100% margin", () => {
    const r = computeFreelanceRate({ ...base, profitMarginPercent: 100 });
    expect(r.requiredRevenue).toBe(Number.POSITIVE_INFINITY);
  });

  it("raises the rate as utilisation falls", () => {
    const high = computeFreelanceRate({ ...base, utilisationPercent: 90 });
    const low = computeFreelanceRate({ ...base, utilisationPercent: 50 });
    expect(low.dayRate).toBeGreaterThan(high.dayRate);
  });

  it("reports the non-billable days that the rate has to absorb", () => {
    const r = computeFreelanceRate(base);
    expect(r.nonBillableDays).toBeCloseTo(69, 9);
  });

  it("does not divide by zero at zero utilisation", () => {
    const r = computeFreelanceRate({ ...base, utilisationPercent: 0 });
    expect(r.dayRate).toBe(0);
    expect(r.hourlyRate).toBe(0);
  });
});

/* ---------------------------------------------------------------- */

describe("true cost of an employee", () => {
  const base = {
    baseSalary: 60000,
    employerChargesPercent: 12,
    benefits: [
      { id: "h", name: "Health", amount: 6000 },
      { id: "p", name: "Pension", amount: 3000 },
    ],
    oneOffCosts: 5000,
    productiveHoursPerYear: 1800,
  };

  it("adds employer charges and benefits to base salary", () => {
    const r = computeEmployeeCost(base);
    expect(r.employerCharges).toBe(7200);
    expect(r.benefitsTotal).toBe(9000);
    expect(r.recurringTotal).toBe(76200);
  });

  it("separates first-year one-off costs from the recurring total", () => {
    const r = computeEmployeeCost(base);
    expect(r.firstYearTotal).toBe(81200);
    expect(r.recurringTotal).toBe(76200);
  });

  it("expresses the total as a multiple of salary", () => {
    const r = computeEmployeeCost(base);
    expect(r.multiple).toBeCloseTo(1.27, 9);
  });

  it("reports the overhead above the salary itself", () => {
    const r = computeEmployeeCost(base);
    expect(r.overhead).toBe(16200);
  });

  it("gives a cost per productive hour", () => {
    const r = computeEmployeeCost(base);
    expect(r.costPerHour).toBeCloseTo(76200 / 1800, 9);
  });

  it("uses only the percentage it is given — no built-in rates", () => {
    const r = computeEmployeeCost({ ...base, employerChargesPercent: 0 });
    expect(r.employerCharges).toBe(0);
    expect(r.recurringTotal).toBe(69000);
  });

  it("does not divide by zero without a salary or hours", () => {
    const r = computeEmployeeCost({
      ...base,
      baseSalary: 0,
      productiveHoursPerYear: 0,
    });
    expect(r.multiple).toBe(0);
    expect(r.costPerHour).toBe(0);
  });
});
