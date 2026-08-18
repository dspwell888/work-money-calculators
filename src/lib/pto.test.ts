import { describe, expect, it } from "vitest";

import {
  computeAccrual,
  computePayout,
  periodsElapsed,
  type AccrualInput,
} from "./pto";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const base: AccrualInput = {
  startDate: "2026-01-01",
  asOfDate: "2026-07-01",
  ratePerPeriod: 4,
  period: "biweekly",
  unit: "hours",
  hoursPerDay: 8,
  used: 0,
  carryover: 0,
  cap: 0,
};

describe("periodsElapsed", () => {
  it("counts only completed periods", () => {
    // 13 days is not yet a fortnight.
    expect(periodsElapsed(d("2026-01-01"), d("2026-01-14"), "biweekly")).toBe(0);
    expect(periodsElapsed(d("2026-01-01"), d("2026-01-15"), "biweekly")).toBe(1);
  });

  it("counts weeks", () => {
    expect(periodsElapsed(d("2026-01-01"), d("2026-01-08"), "weekly")).toBe(1);
    expect(periodsElapsed(d("2026-01-01"), d("2026-02-01"), "weekly")).toBe(4);
  });

  it("counts whole months, not part months", () => {
    expect(periodsElapsed(d("2026-01-31"), d("2026-02-28"), "monthly")).toBe(0);
    expect(periodsElapsed(d("2026-01-15"), d("2026-02-15"), "monthly")).toBe(1);
    expect(periodsElapsed(d("2026-01-15"), d("2026-02-14"), "monthly")).toBe(0);
    expect(periodsElapsed(d("2026-01-01"), d("2026-07-01"), "monthly")).toBe(6);
  });

  it("credits twice a month on a semimonthly schedule", () => {
    expect(periodsElapsed(d("2026-01-01"), d("2026-01-15"), "semimonthly")).toBe(1);
    expect(periodsElapsed(d("2026-01-01"), d("2026-02-01"), "semimonthly")).toBe(2);
    expect(periodsElapsed(d("2026-01-01"), d("2026-02-16"), "semimonthly")).toBe(3);
  });

  it("counts whole years", () => {
    expect(periodsElapsed(d("2026-01-01"), d("2026-12-31"), "annual")).toBe(0);
    expect(periodsElapsed(d("2026-01-01"), d("2027-01-01"), "annual")).toBe(1);
  });

  it("never goes negative when the as-of date precedes the start", () => {
    expect(periodsElapsed(d("2026-07-01"), d("2026-01-01"), "monthly")).toBe(0);
  });
});

describe("computeAccrual", () => {
  it("accrues 4 hours a fortnight over half a year", () => {
    // 1 Jan to 1 Jul is 181 days = 12 whole fortnights.
    const r = computeAccrual(base);
    expect(r.periodsElapsed).toBe(12);
    expect(r.accrued).toBe(48);
    expect(r.balance).toBe(48);
    expect(r.accruedPerYear).toBe(104);
  });

  it("subtracts time already used", () => {
    const r = computeAccrual({ ...base, used: 16 });
    expect(r.balance).toBe(32);
  });

  it("adds carryover from last year", () => {
    const r = computeAccrual({ ...base, carryover: 10 });
    expect(r.accrued).toBe(58);
    expect(r.balance).toBe(58);
  });

  it("applies a cap and reports what was forfeited", () => {
    const r = computeAccrual({ ...base, carryover: 10, cap: 50 });
    expect(r.accruedRaw).toBe(48);
    expect(r.accrued).toBe(50);
    expect(r.forfeited).toBe(8);
    expect(r.balance).toBe(50);
  });

  it("does not cap when the cap is zero", () => {
    const r = computeAccrual({ ...base, cap: 0 });
    expect(r.forfeited).toBe(0);
  });

  it("converts between hours and days both ways", () => {
    const inHours = computeAccrual(base);
    expect(inHours.balanceHours).toBe(48);
    expect(inHours.balanceDays).toBe(6);

    const inDays = computeAccrual({
      ...base,
      unit: "days",
      ratePerPeriod: 0.5,
    });
    expect(inDays.balanceDays).toBe(6);
    expect(inDays.balanceHours).toBe(48);
  });

  it("allows a negative balance rather than hiding an overdraft", () => {
    const r = computeAccrual({ ...base, used: 60 });
    expect(r.balance).toBe(-12);
  });

  it("returns zero rather than NaN for an unparseable date", () => {
    const r = computeAccrual({ ...base, startDate: "not-a-date" });
    expect(r.periodsElapsed).toBe(0);
    expect(r.daysBetween).toBeNull();
    expect(Number.isFinite(r.balance)).toBe(true);
  });

  it("falls back to an 8-hour day rather than dividing by zero", () => {
    const r = computeAccrual({ ...base, hoursPerDay: 0 });
    expect(Number.isFinite(r.balanceDays)).toBe(true);
    expect(r.balanceDays).toBe(6);
  });
});

describe("computePayout", () => {
  it("cashes out the balance at the hourly rate", () => {
    expect(computePayout(48, 25)).toBe(1200);
  });

  it("never pays out a negative balance", () => {
    expect(computePayout(-10, 25)).toBe(0);
  });
});
