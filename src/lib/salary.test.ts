import { describe, expect, it } from "vitest";

import {
  applyEstimatedRate,
  breakdown,
  computeRaise,
  computeRealRaise,
  explainRaise,
  DEFAULT_SCHEDULE,
  formatCurrency,
  formatMoneyDisplay,
  formatPercent,
  formatSigned,
  fromAnnual,
  parseNumber,
  periodsPerYear,
  realRaiseVerdict,
  toAnnual,
  type Scenario,
} from "./salary";
import { computeWageInflation } from "./comp";

const S = DEFAULT_SCHEDULE; // 40 h/wk, 52 wk/yr → 2080 h/yr

function scenario(over: Partial<Scenario> = {}): Scenario {
  return {
    id: "s0",
    label: "Scenario A",
    mode: "percent",
    percent: 0,
    amount: 0,
    amountPeriod: "annual",
    target: 0,
    targetPeriod: "annual",
    ...over,
  };
}

describe("period conversion", () => {
  it("counts periods in a year", () => {
    expect(periodsPerYear("hourly", S)).toBe(2080);
    expect(periodsPerYear("weekly", S)).toBe(52);
    expect(periodsPerYear("biweekly", S)).toBe(26);
    expect(periodsPerYear("monthly", S)).toBe(12);
    expect(periodsPerYear("annual", S)).toBe(1);
  });

  it("round-trips every period through annual", () => {
    for (const p of ["hourly", "weekly", "biweekly", "monthly", "annual"] as const) {
      const annual = toAnnual(1234.56, p, S);
      expect(fromAnnual(annual, p, S)).toBeCloseTo(1234.56, 9);
    }
  });

  it("honours a non-standard schedule", () => {
    const part = { hoursPerWeek: 37.5, weeksPerYear: 48 };
    // The figure verified by hand: 30 × 37.5 × 48.
    expect(toAnnual(30, "hourly", part)).toBe(54000);
    expect(fromAnnual(54000, "weekly", part)).toBe(1125);
  });

  it("does not divide by zero when a schedule is empty", () => {
    const none = { hoursPerWeek: 0, weeksPerYear: 0 };
    expect(fromAnnual(50000, "hourly", none)).toBe(0);
    expect(Number.isFinite(fromAnnual(50000, "weekly", none))).toBe(true);
  });

  it("expresses one annual figure in every period at once", () => {
    const b = breakdown(62400, S);
    expect(b.hourly).toBe(30);
    expect(b.weekly).toBe(1200);
    expect(b.biweekly).toBe(2400);
    expect(b.monthly).toBe(5200);
    expect(b.annual).toBe(62400);
  });
});

describe("computeRaise — percent mode", () => {
  it("applies a percentage to annual pay", () => {
    const r = computeRaise(60000, scenario({ percent: 5 }), S);
    expect(r.newAnnual).toBe(63000);
    expect(r.increaseAnnual).toBe(3000);
    expect(r.percent).toBeCloseTo(5, 9);
  });

  it("works from an hourly basis", () => {
    // $30/h × 2080 = $62,400 → +6% = $66,144
    const r = computeRaise(toAnnual(30, "hourly", S), scenario({ percent: 6 }), S);
    expect(r.newAnnual).toBeCloseTo(66144, 6);
    expect(r.next.hourly).toBeCloseTo(31.8, 9);
    expect(r.increase.hourly).toBeCloseTo(1.8, 9);
  });

  it("treats a negative percentage as a pay cut", () => {
    const r = computeRaise(60000, scenario({ percent: -10 }), S);
    expect(r.newAnnual).toBe(54000);
    expect(r.increaseAnnual).toBe(-6000);
    expect(r.percent).toBeCloseTo(-10, 9);
  });
});

describe("computeRaise — amount mode", () => {
  it("adds a flat annual increase and derives the percentage", () => {
    const r = computeRaise(
      60000,
      scenario({ mode: "amount", amount: 5000, amountPeriod: "annual" }),
      S,
    );
    expect(r.newAnnual).toBe(65000);
    expect(r.percent).toBeCloseTo(8.3333, 4);
  });

  it("converts an hourly increase to the same annual basis", () => {
    // +$2/h on $30/h: $62,400 → $66,560, which is +6.67%
    const r = computeRaise(
      62400,
      scenario({ mode: "amount", amount: 2, amountPeriod: "hourly" }),
      S,
    );
    expect(r.newAnnual).toBe(66560);
    expect(r.increaseAnnual).toBe(4160);
    expect(r.percent).toBeCloseTo(6.6667, 4);
  });

  it("keeps $2/hour and $4,000/year distinct", () => {
    const hourly = computeRaise(
      62400,
      scenario({ mode: "amount", amount: 2, amountPeriod: "hourly" }),
      S,
    );
    const annual = computeRaise(
      62400,
      scenario({ mode: "amount", amount: 4000, amountPeriod: "annual" }),
      S,
    );
    expect(hourly.newAnnual).not.toBe(annual.newAnnual);
  });
});

describe("computeRaise — target mode", () => {
  it("reverses a target salary into a raise percentage", () => {
    const r = computeRaise(
      62400,
      scenario({ mode: "target", target: 80000, targetPeriod: "annual" }),
      S,
    );
    expect(r.newAnnual).toBe(80000);
    expect(r.increaseAnnual).toBe(17600);
    expect(r.percent).toBeCloseTo(28.2051, 4);
  });

  it("reports a target below current pay as negative", () => {
    const r = computeRaise(
      62400,
      scenario({ mode: "target", target: 50000, targetPeriod: "annual" }),
      S,
    );
    expect(r.increaseAnnual).toBe(-12400);
    expect(r.percent).toBeCloseTo(-19.8718, 4);
  });
});

describe("edge cases that must never produce NaN or Infinity", () => {
  it("survives zero current pay", () => {
    const r = computeRaise(0, scenario({ percent: 5 }), S);
    expect(r.percent).toBe(0);
    expect(Number.isFinite(r.newAnnual)).toBe(true);
    expect(Number.isFinite(r.next.hourly)).toBe(true);
  });

  it("survives a zero-hour schedule", () => {
    const r = computeRaise(60000, scenario({ percent: 5 }), {
      hoursPerWeek: 0,
      weeksPerYear: 0,
    });
    expect(Object.values(r.next).every(Number.isFinite)).toBe(true);
  });
});

describe("formatting", () => {
  it("formats currency with and without cents", () => {
    expect(formatCurrency(63000)).toBe("$63,000.00");
    expect(formatCurrency(63000, true)).toBe("$63,000");
  });

  it("drops the cents from headline figures only when there are none", () => {
    expect(formatMoneyDisplay(63000)).toBe("$63,000");
    expect(formatMoneyDisplay(30.29)).toBe("$30.29");
  });

  it("never renders negative zero", () => {
    expect(formatCurrency(-0)).toBe("$0.00");
  });

  it("signs percentages and deltas", () => {
    expect(formatPercent(5)).toBe("+5%");
    expect(formatPercent(-10)).toBe("-10%");
    expect(formatSigned(3000)).toBe("+$3,000.00");
    expect(formatSigned(-3000)).toBe("−$3,000.00");
    expect(formatSigned(0)).toBe("$0.00");
  });

  it("returns a dash rather than NaN", () => {
    expect(formatCurrency(NaN)).toBe("—");
    expect(formatPercent(Infinity)).toBe("—");
  });

  it("parses what people actually type", () => {
    expect(parseNumber("$60,000")).toBe(60000);
    expect(parseNumber("  1,234.56 ")).toBe(1234.56);
    expect(parseNumber("abc")).toBe(0);
    expect(parseNumber("")).toBe(0);
  });
});

describe("estimated take-home", () => {
  it("applies only the rate it is given", () => {
    expect(applyEstimatedRate(64896, 28)).toBeCloseTo(46725.12, 2);
    expect(applyEstimatedRate(100, 0)).toBe(100);
  });
});

describe("computeRealRaise — the exact form, not the subtraction", () => {
  it("turns a 3% raise against 4% inflation into a real cut", () => {
    const r = computeRealRaise(60000, 61800, 4);
    expect(r.nominalPercent).toBeCloseTo(3, 9);
    // Exact: 1.03 / 1.04 − 1 = −0.9615%. The rule of thumb says −1%.
    expect(r.realPercent).toBeCloseTo(-0.9615, 3);
    expect(r.approxPercent).toBeCloseTo(-1, 9);
    expect(r.isRealCut).toBe(true);
    expect(r.purchasingPowerChange).toBeLessThan(0);
  });

  it("keeps the money figure and the percentage consistent", () => {
    const r = computeRealRaise(60000, 61800, 4);
    // The percentage is exactly the money change over the old salary.
    expect(r.realPercent).toBeCloseTo(
      (r.purchasingPowerChange / 60000) * 100,
      9,
    );
    expect(r.realNewAnnual).toBeCloseTo(61800 / 1.04, 6);
  });

  it("agrees with the wage inflation calculator over one year", () => {
    // Cross-tool check: two pages must not disagree about the same question.
    const raise = computeRealRaise(60000, 66000, 5);
    const inflation = computeWageInflation({
      startSalary: 60000,
      endSalary: 66000,
      years: 1,
      annualInflationPercent: 5,
    });
    expect(raise.realNewAnnual).toBeCloseTo(inflation.realEndSalary, 6);
    expect(raise.purchasingPowerChange).toBeCloseTo(inflation.realChange, 6);
    expect(raise.realPercent).toBeCloseTo(inflation.realChangePercent, 6);
    expect(raise.breakEvenAnnual).toBeCloseTo(inflation.breakEvenSalary, 6);
  });

  it("diverges from the rule of thumb as rates grow", () => {
    const small = computeRealRaise(60000, 61800, 4);
    const large = computeRealRaise(60000, 72000, 10);
    expect(Math.abs(small.realPercent - small.approxPercent)).toBeLessThan(0.05);
    // 20% against 10% is 9.09% exact against 10% approximate.
    expect(large.realPercent).toBeCloseTo(9.0909, 3);
    expect(Math.abs(large.realPercent - large.approxPercent)).toBeGreaterThan(0.8);
  });

  it("leaves the raise untouched when prices are flat", () => {
    const r = computeRealRaise(60000, 63000, 0);
    expect(r.realPercent).toBeCloseTo(r.nominalPercent, 9);
    expect(r.realNewAnnual).toBe(63000);
    expect(r.isRealCut).toBe(false);
  });

  it("reports break-even and the gap against it", () => {
    const r = computeRealRaise(60000, 61800, 4);
    expect(r.breakEvenAnnual).toBeCloseTo(62400, 6);
    expect(r.breakEvenGap).toBeCloseTo(61800 - 62400, 6);
    // The gap and the real change must always agree in sign.
    expect(Math.sign(r.breakEvenGap)).toBe(Math.sign(r.purchasingPowerChange));
  });

  it("calls a raise exactly matching inflation a wash", () => {
    const r = computeRealRaise(60000, 62400, 4);
    expect(r.realPercent).toBeCloseTo(0, 9);
    expect(r.isRealCut).toBe(false);
    expect(r.breakEvenGap).toBeCloseTo(0, 6);
  });

  it("does not divide by zero or flip sign on impossible inputs", () => {
    expect(computeRealRaise(0, 60000, 4).realPercent).toBe(0);
    const negative = computeRealRaise(60000, 63000, -150);
    expect(Number.isFinite(negative.realNewAnnual)).toBe(true);
    // A price factor at or below zero falls back to "prices did not move".
    expect(negative.realNewAnnual).toBe(63000);
  });
});

describe("realRaiseVerdict", () => {
  it("names the loss when a rise is a real cut", () => {
    const v = realRaiseVerdict(computeRealRaise(60000, 61800, 4));
    expect(v).toContain("+3%");
    expect(v).toContain("4%");
    expect(v).toMatch(/buying power fell/);
  });

  it("says so plainly when the raise is genuinely ahead", () => {
    const v = realRaiseVerdict(computeRealRaise(60000, 66000, 2));
    expect(v).toMatch(/better off/);
  });

  it("calls a wash a wash", () => {
    const v = realRaiseVerdict(computeRealRaise(60000, 62400, 4));
    expect(v).toMatch(/exactly where you started/);
  });

  it("handles flat prices without claiming inflation did anything", () => {
    const v = realRaiseVerdict(computeRealRaise(60000, 63000, 0));
    expect(v).toMatch(/prices flat/);
  });
});

describe("explainRaise — substitute the visitor's numbers", () => {
  it("writes the 5% on $60,000 example with the paycheck and real-raise lines", () => {
    const sc = scenario({ percent: 5 });
    const result = computeRaise(60000, sc, S);
    const lines = explainRaise({
      currentAnnual: 60000,
      scenario: sc,
      result,
      schedule: S,
      period: "biweekly",
      inflationPercent: 3,
    });
    expect(lines[0]).toEqual({
      expression: "$60,000 × (1 + 5 ÷ 100)",
      result: "$63,000",
      unit: "per year",
    });
    expect(lines[1]).toEqual({
      expression: "($63,000 − $60,000) ÷ 26",
      result: "$115.38",
      unit: "every 2 weeks",
    });
    expect(lines[2]).toEqual({
      expression: "((1 + 5 ÷ 100) ÷ (1 + 3 ÷ 100) − 1) × 100",
      result: "+1.94%",
      unit: "real raise",
    });
  });

  it("shows the annualisation step for an hourly flat increase", () => {
    const sc = scenario({ mode: "amount", amount: 2, amountPeriod: "hourly" });
    const result = computeRaise(62400, sc, S);
    const lines = explainRaise({
      currentAnnual: 62400,
      scenario: sc,
      result,
      schedule: S,
      period: "annual",
      inflationPercent: 0,
    });
    expect(lines[0]).toEqual({
      expression: "$2 per hour × 2,080",
      result: "$4,160",
      unit: "a year",
    });
    expect(lines[1]).toEqual({
      expression: "$62,400 + $4,160",
      result: "$66,560",
      unit: "per year",
    });
  });

  it("reverses a target salary into an increase and a percentage", () => {
    const sc = scenario({
      mode: "target",
      target: 80000,
      targetPeriod: "annual",
    });
    const result = computeRaise(62400, sc, S);
    const lines = explainRaise({
      currentAnnual: 62400,
      scenario: sc,
      result,
      schedule: S,
      period: "annual",
      inflationPercent: 0,
    });
    expect(lines[0]).toEqual({
      expression: "$80,000 − $62,400",
      result: "$17,600",
      unit: "increase",
    });
    expect(lines[1].expression).toBe("$17,600 ÷ $62,400 × 100");
    expect(lines[1].result).toBe("+28.21%");
  });
});
