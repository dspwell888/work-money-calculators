import { describe, expect, it } from "vitest";

import {
  formatClock,
  formatDecimal,
  formatWords,
  fromDecimal,
  fromDecimalToMinute,
  parseTimeEntry,
  roundDecimal,
  sumSignedDurations,
  clockDifference,
  toDecimal,
} from "./time-decimal";

describe("toDecimal", () => {
  it("converts the cases from the page copy", () => {
    expect(toDecimal({ hours: 7, minutes: 20, seconds: 0 })).toBeCloseTo(7.3333, 4);
    expect(toDecimal({ hours: 7, minutes: 30, seconds: 0 })).toBe(7.5);
    expect(toDecimal({ hours: 6, minutes: 45, seconds: 0 })).toBe(6.75);
    expect(toDecimal({ hours: 0, minutes: 15, seconds: 0 })).toBe(0.25);
  });

  it("includes seconds", () => {
    expect(toDecimal({ hours: 1, minutes: 0, seconds: 1800 })).toBe(1.5);
  });
});

describe("round-trip: this is the bug that shipped once", () => {
  it("7:20 → 7.33 → 7:20", () => {
    const decimal = toDecimal({ hours: 7, minutes: 20, seconds: 0 });
    expect(formatDecimal(decimal)).toBe("7.33");
    // Truncating here would give 7:19, which is what the first version did.
    expect(formatClock(fromDecimalToMinute(Number(formatDecimal(decimal))))).toBe(
      "7:20",
    );
  });

  it("round-trips every quarter hour", () => {
    for (let m = 0; m < 60; m += 15) {
      const decimal = toDecimal({ hours: 3, minutes: m, seconds: 0 });
      const back = fromDecimalToMinute(decimal);
      expect(back.hours).toBe(3);
      expect(back.minutes).toBe(m);
    }
  });

  it("round-trips every whole minute of an hour", () => {
    for (let m = 0; m < 60; m++) {
      const decimal = toDecimal({ hours: 1, minutes: m, seconds: 0 });
      expect(fromDecimalToMinute(decimal).minutes).toBe(m);
    }
  });
});

describe("fromDecimalToMinute", () => {
  it("rounds rather than truncates", () => {
    expect(formatClock(fromDecimalToMinute(7.33))).toBe("7:20");
    expect(formatClock(fromDecimalToMinute(0.25))).toBe("0:15");
    expect(formatClock(fromDecimalToMinute(12.5))).toBe("12:30");
  });

  it("carries 59.6 minutes up to the next hour", () => {
    expect(formatClock(fromDecimalToMinute(1.999))).toBe("2:00");
  });

  it("handles negatives", () => {
    expect(formatClock(fromDecimalToMinute(-1.5))).toBe("−1:30");
  });
});

describe("fromDecimal keeps seconds exact", () => {
  it("expresses 7.33 as 7:19:48", () => {
    const t = fromDecimal(7.33);
    expect(t.hours).toBe(7);
    expect(t.minutes).toBe(19);
    expect(t.seconds).toBe(48);
  });

  it("never renders 59:60", () => {
    const t = fromDecimal(1.99999);
    expect(t.seconds).toBeLessThan(60);
    expect(t.minutes).toBeLessThan(60);
    expect(formatClock(t, true)).toBe("2:00:00");
  });
});

describe("payroll rounding", () => {
  it("rounds to the nearest quarter hour", () => {
    expect(roundDecimal(7.3333, "15")).toBe(7.25);
    expect(roundDecimal(6.75, "15")).toBe(6.75);
    expect(roundDecimal(7.5, "15")).toBe(7.5);
    expect(roundDecimal(7.4, "15")).toBeCloseTo(7.5, 9);
  });

  it("rounds to the nearest tenth of an hour", () => {
    expect(roundDecimal(7.3333, "6")).toBeCloseTo(7.3, 9);
    expect(roundDecimal(7.28, "6")).toBeCloseTo(7.3, 9);
  });

  it("leaves the figure alone when rounding is off", () => {
    expect(roundDecimal(7.3333, "none")).toBe(7.3333);
  });

  it("sums a rounded timesheet the way payroll does", () => {
    // Each entry rounded first, then added — verified by hand as 21.50.
    const entries = [7.3333, 6.75, 7.5];
    const total = entries.reduce((s, e) => s + roundDecimal(e, "15"), 0);
    expect(total).toBeCloseTo(21.5, 9);
  });
});

describe("parseTimeEntry accepts what people type", () => {
  const cases: [string, number][] = [
    ["7:20", 7.3333],
    ["7.5", 7.5],
    ["7h20", 7.3333],
    ["7h 20m", 7.3333],
    ["7 20", 7.3333],
    ["450m", 7.5],
    ["90 min", 1.5],
    ["7:20:30", 7.3417],
  ];

  it.each(cases)("parses %s", (input, expected) => {
    const parsed = parseTimeEntry(input);
    expect(parsed).not.toBeNull();
    expect(toDecimal(parsed!)).toBeCloseTo(expected, 3);
  });

  it("rejects what is not a time rather than counting it as zero", () => {
    expect(parseTimeEntry("banana")).toBeNull();
    expect(parseTimeEntry("")).toBeNull();
    expect(parseTimeEntry("   ")).toBeNull();
  });
});

describe("formatting", () => {
  it("writes clock and word forms", () => {
    expect(formatClock({ hours: 7, minutes: 5, seconds: 0 })).toBe("7:05");
    expect(formatWords({ hours: 7, minutes: 20, seconds: 0 })).toBe("7 h 20 min");
    expect(formatWords({ hours: 7, minutes: 0, seconds: 0 })).toBe("7 h");
    expect(formatWords({ hours: 0, minutes: 45, seconds: 0 })).toBe("45 min");
  });

  it("returns a dash rather than NaN", () => {
    expect(formatDecimal(NaN)).toBe("—");
  });
});

describe("sumSignedDurations", () => {
  const rows = (...specs: [string, string][]) =>
    specs.map(([sign, raw], i) => ({
      id: `d${i}`,
      sign: sign as "+" | "-",
      raw,
    }));

  it("adds durations and keeps a running total", () => {
    const r = sumSignedDurations(rows(["+", "2:45"], ["+", "1:30"]));
    expect(r.total).toBeCloseTo(4.25, 9);
    expect(r.lines[0].runningTotal).toBeCloseTo(2.75, 9);
    expect(r.lines[1].runningTotal).toBeCloseTo(4.25, 9);
  });

  it("subtracts when the sign is minus", () => {
    const r = sumSignedDurations(rows(["+", "8:00"], ["-", "0:45"]));
    expect(r.total).toBeCloseTo(7.25, 9);
  });

  it("allows a negative total rather than clamping it", () => {
    const r = sumSignedDurations(rows(["+", "1:00"], ["-", "2:30"]));
    expect(r.total).toBeCloseTo(-1.5, 9);
  });

  it("skips unreadable rows without breaking the total", () => {
    const r = sumSignedDurations(rows(["+", "2:00"], ["+", "nope"]));
    expect(r.total).toBe(2);
    expect(r.counted).toBe(1);
    expect(r.lines[1].decimal).toBeNull();
  });

  it("handles an empty list", () => {
    expect(sumSignedDurations([]).total).toBe(0);
  });
});

describe("clockDifference", () => {
  it("measures a normal working day", () => {
    expect(clockDifference("09:00", "17:30")).toBeCloseTo(8.5, 9);
  });

  it("crosses midnight, matching the time card convention", () => {
    expect(clockDifference("22:00", "06:00")).toBeCloseTo(8, 9);
  });

  it("treats identical times as a full day", () => {
    expect(clockDifference("09:00", "09:00")).toBeCloseTo(24, 9);
  });

  it("returns null when either time is unreadable", () => {
    expect(clockDifference("nope", "17:00")).toBeNull();
  });
});
