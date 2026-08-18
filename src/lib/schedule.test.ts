import { describe, expect, it } from "vitest";

import {
  computeSchedule,
  OFF,
  scheduleDates,
  shiftHours,
  toCsv,
  weekdayOf,
  type Employee,
  type ShiftTemplate,
} from "./schedule";

const EARLY: ShiftTemplate = {
  code: "E",
  label: "Early",
  start: "07:00",
  end: "15:00",
  breakMinutes: 30,
};
const LATE: ShiftTemplate = {
  code: "L",
  label: "Late",
  start: "15:00",
  end: "23:00",
  breakMinutes: 30,
};
const NIGHT: ShiftTemplate = {
  code: "N",
  label: "Night",
  start: "23:00",
  end: "07:00",
  breakMinutes: 60,
};

const TEMPLATES = [EARLY, LATE, NIGHT];

const employee = (
  name: string,
  rate: number,
  days: string[],
): Employee => ({ id: name, name, hourlyRate: rate, days });

describe("shiftHours", () => {
  it("subtracts the unpaid break", () => {
    expect(shiftHours(EARLY).minutes).toBe(450); // 8 h less 30 min
  });

  it("crosses midnight, matching the time card convention", () => {
    const r = shiftHours(NIGHT);
    expect(r.crossesMidnight).toBe(true);
    expect(r.minutes).toBe(420); // 8 h less a 60 min break
  });

  it("clamps to zero and flags a break longer than the shift", () => {
    const r = shiftHours({ ...EARLY, breakMinutes: 600 });
    expect(r.minutes).toBe(0);
    expect(r.breakTooLong).toBe(true);
  });

  it("returns null for an unreadable time rather than zero", () => {
    expect(shiftHours({ ...EARLY, start: "oops" }).minutes).toBeNull();
  });
});

describe("scheduleDates", () => {
  it("walks forward from the start date", () => {
    const d = scheduleDates("2026-03-01", 3);
    expect(d).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
  });

  it("crosses a month boundary", () => {
    expect(scheduleDates("2026-03-30", 3)).toEqual([
      "2026-03-30",
      "2026-03-31",
      "2026-04-01",
    ]);
  });

  it("names weekdays", () => {
    expect(weekdayOf("2026-03-01")).toBe("Sun");
    expect(weekdayOf("2026-03-02")).toBe("Mon");
  });
});

describe("computeSchedule", () => {
  const week = (codes: string) => codes.split("");

  it("totals one person's week", () => {
    const staff = [employee("Ana", 20, week("EEEEE--"))];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    // 5 × 7.5 h = 37.5 h, under the threshold.
    expect(r.employees[0].totalMinutes).toBe(2250);
    expect(r.employees[0].overtimeMinutes).toBe(0);
    expect(r.employees[0].pay).toBeCloseTo(37.5 * 20, 9);
    expect(r.employees[0].shiftsWorked).toBe(5);
    expect(r.employees[0].daysOff).toBe(2);
  });

  it("charges overtime past the weekly threshold", () => {
    // Six early shifts = 45 h, so 5 h of overtime.
    const staff = [employee("Ben", 20, week("EEEEEE-"))];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    expect(r.employees[0].totalMinutes / 60).toBe(45);
    expect(r.employees[0].overtimeMinutes / 60).toBe(5);
    expect(r.employees[0].pay).toBeCloseTo(40 * 20 + 5 * 20 * 1.5, 9);
  });

  it("counts weeks in blocks of seven from the start date, not the calendar", () => {
    // 14-day roster: week 1 heavy, week 2 light.
    const staff = [
      employee("Cara", 20, [...week("EEEEEE-"), ...week("EEE----")]),
    ];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-04", 14, 40, 1.5);
    expect(r.employees[0].weeks).toHaveLength(2);
    expect(r.employees[0].weeks[0].minutes / 60).toBe(45);
    expect(r.employees[0].weeks[1].minutes / 60).toBe(22.5);
    // Averaging the fortnight would give zero overtime. It must be five hours.
    expect(r.employees[0].overtimeMinutes / 60).toBe(5);
  });

  it("treats OFF days as zero without counting them as shifts", () => {
    const staff = [employee("Dee", 20, week("-------"))];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    expect(r.employees[0].totalMinutes).toBe(0);
    expect(r.employees[0].shiftsWorked).toBe(0);
    expect(r.staffed).toBe(0);
  });

  it("ignores a code with no matching template", () => {
    const staff = [employee("Eve", 20, week("ZZZ----"))];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    expect(r.employees[0].totalMinutes).toBe(0);
  });

  it("adds up coverage per day across the team", () => {
    const staff = [
      employee("Ana", 20, week("EE-----")),
      employee("Ben", 22, week("LL-----")),
      employee("Cara", 25, week("N------")),
    ];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    // Day 0: early + late + night = 450 + 450 + 420
    expect(r.days[0].minutes).toBe(1320);
    expect(r.days[0].headcount).toBe(3);
    expect(r.days[1].headcount).toBe(2);
    expect(r.days[2].headcount).toBe(0);
    expect(r.staffed).toBe(3);
  });

  it("costs each person at their own rate", () => {
    const staff = [
      employee("Ana", 20, week("E------")),
      employee("Ben", 30, week("E------")),
    ];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    expect(r.employees[0].pay).toBeCloseTo(7.5 * 20, 9);
    expect(r.employees[1].pay).toBeCloseTo(7.5 * 30, 9);
    expect(r.totalCost).toBeCloseTo(7.5 * 50, 9);
  });

  it("pays everything straight when the threshold is zero", () => {
    const staff = [employee("Ana", 20, week("EEEEEEE"))];
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 0, 1.5);
    expect(r.employees[0].overtimeMinutes).toBe(0);
    expect(r.employees[0].pay).toBeCloseTo(52.5 * 20, 9);
  });

  it("handles an empty roster without NaN", () => {
    const r = computeSchedule([], TEMPLATES, "2026-03-01", 7, 40, 1.5);
    expect(r.totalCost).toBe(0);
    expect(r.totalMinutes).toBe(0);
    expect(r.days).toHaveLength(7);
    expect(r.days.every((d) => d.headcount === 0)).toBe(true);
  });
});

describe("toCsv", () => {
  const staff = [employee("Ana", 20, "EE-----".split(""))];
  const dates = scheduleDates("2026-03-01", 7);

  it("writes a header, a row per person, and a totals row", () => {
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    const rows = toCsv(r, TEMPLATES, dates).split("\n");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain("Employee");
    expect(rows[0]).toContain("Sun 2026-03-01");
    expect(rows[1]).toContain("Ana");
    expect(rows[1]).toContain("Early 07:00-15:00");
    expect(rows[2]).toContain("Total");
  });

  it("leaves days off blank", () => {
    const r = computeSchedule(staff, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    const cells = toCsv(r, TEMPLATES, dates).split("\n")[1].split(",");
    // Rate is index 1, so day columns start at 2. Day 2 onward are off.
    expect(cells[4]).toBe("");
  });

  it("quotes a name containing a comma", () => {
    const odd = [employee("Smith, Ana", 20, "E------".split(""))];
    const r = computeSchedule(odd, TEMPLATES, "2026-03-01", 7, 40, 1.5);
    expect(toCsv(r, TEMPLATES, dates)).toContain('"Smith, Ana"');
  });
});

describe("OFF sentinel", () => {
  it("is a single character so the grid and share link stay compact", () => {
    expect(OFF).toHaveLength(1);
  });
});
