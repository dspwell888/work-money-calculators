"use client";

import * as React from "react";
import { Link2 } from "lucide-react";

import {
  BreakdownTable,
  CopyButton,
  Field,
  Headline,
  ModeTabs,
  MoneyInput,
  Panel,
  PanelHead,
  PlainInput,
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import { applyEstimatedRate, formatCurrency, parseNumber } from "@/lib/salary";
import { computeHourlySalary, salaryToHourly } from "@/lib/work-math";

type Direction = "toSalary" | "toHourly";

interface State {
  direction: Direction;
  hourlyRate: string;
  annualSalary: string;
  hoursPerWeek: string;
  weeksPerYear: string;
  overtimeHours: string;
  overtimeMultiplier: string;
  unpaidDaysOff: string;
  taxRate: string;
}

const INITIAL: State = {
  direction: "toSalary",
  hourlyRate: "25",
  annualSalary: "52000",
  hoursPerWeek: "40",
  weeksPerYear: "52",
  overtimeHours: "0",
  overtimeMultiplier: "1.5",
  unpaidDaysOff: "0",
  taxRate: "",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("dir", s.direction);
  q.set(s.direction === "toSalary" ? "rate" : "salary",
    s.direction === "toSalary" ? s.hourlyRate : s.annualSalary);
  q.set("hpw", s.hoursPerWeek);
  q.set("wpy", s.weeksPerYear);
  if (parseNumber(s.overtimeHours) > 0) {
    q.set("oth", s.overtimeHours);
    q.set("otm", s.overtimeMultiplier);
  }
  if (parseNumber(s.unpaidDaysOff) > 0) q.set("off", s.unpaidDaysOff);
  if (s.taxRate) q.set("tax", s.taxRate);
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("rate") && !q.has("salary")) return null;
  return {
    direction: q.get("dir") === "toHourly" ? "toHourly" : "toSalary",
    hourlyRate: q.get("rate") ?? INITIAL.hourlyRate,
    annualSalary: q.get("salary") ?? INITIAL.annualSalary,
    hoursPerWeek: q.get("hpw") ?? INITIAL.hoursPerWeek,
    weeksPerYear: q.get("wpy") ?? INITIAL.weeksPerYear,
    overtimeHours: q.get("oth") ?? INITIAL.overtimeHours,
    overtimeMultiplier: q.get("otm") ?? INITIAL.overtimeMultiplier,
    unpaidDaysOff: q.get("off") ?? INITIAL.unpaidDaysOff,
    taxRate: q.get("tax") ?? "",
  };
}

export function HourlySalaryCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const toSalary = state.direction === "toSalary";
  const hoursPerWeek = parseNumber(state.hoursPerWeek);
  const weeksPerYear = parseNumber(state.weeksPerYear);

  // Going salary → hourly, the implied rate becomes the input to the same
  // engine, so both directions share one code path and cannot disagree.
  const hourlyRate = toSalary
    ? parseNumber(state.hourlyRate)
    : salaryToHourly(
        parseNumber(state.annualSalary),
        hoursPerWeek,
        weeksPerYear,
      );

  const result = computeHourlySalary({
    hourlyRate,
    hoursPerWeek,
    weeksPerYear,
    overtimeHours: parseNumber(state.overtimeHours),
    overtimeMultiplier: parseNumber(state.overtimeMultiplier) || 1.5,
    unpaidDaysOff: parseNumber(state.unpaidDaysOff),
  });

  const taxRate = state.taxRate ? parseNumber(state.taxRate) : null;
  const showTakeHome = taxRate !== null && taxRate > 0 && taxRate < 100;

  const rows = [
    { label: "Per year", value: formatCurrency(result.annual, true), emphasis: toSalary },
    { label: "Per month", value: formatCurrency(result.monthly) },
    { label: "Every 2 weeks", value: formatCurrency(result.biweekly) },
    { label: "Per week", value: formatCurrency(result.weekly) },
    { label: "Per day (5-day week)", value: formatCurrency(result.daily) },
    {
      label: "Per hour",
      value: formatCurrency(result.hourly),
      emphasis: !toSalary,
    },
  ];

  if (result.overtimeAnnual > 0) {
    rows.push({
      label: "Of which overtime, per year",
      value: formatCurrency(result.overtimeAnnual, true),
    });
  }

  if (showTakeHome) {
    rows.push({
      label: `Est. take-home per year (at ${taxRate}%)`,
      value: formatCurrency(applyEstimatedRate(result.annual, taxRate), true),
    });
  }

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="What you are converting" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <div className="flex flex-col gap-2">
            <span className="kicker">Direction</span>
            <ModeTabs<Direction>
              value={state.direction}
              onChange={(direction) => patch({ direction })}
              options={[
                { value: "toSalary", label: "Hourly → salary" },
                { value: "toHourly", label: "Salary → hourly" },
              ]}
            />
          </div>
          {toSalary ? (
            <Field label="Hourly rate" htmlFor="hourly-rate">
              <MoneyInput
                id="hourly-rate"
                value={state.hourlyRate}
                onChange={(hourlyRate) => patch({ hourlyRate })}
              />
            </Field>
          ) : (
            <Field label="Annual salary" htmlFor="annual-salary">
              <MoneyInput
                id="annual-salary"
                value={state.annualSalary}
                onChange={(annualSalary) => patch({ annualSalary })}
              />
            </Field>
          )}
        </div>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours a week" htmlFor="hpw">
                <PlainInput
                  id="hpw"
                  value={state.hoursPerWeek}
                  onChange={(hoursPerWeek) => patch({ hoursPerWeek })}
                />
              </Field>
              <Field label="Weeks a year" htmlFor="wpy">
                <PlainInput
                  id="wpy"
                  value={state.weeksPerYear}
                  onChange={(weeksPerYear) => patch({ weeksPerYear })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Overtime h/week" htmlFor="oth">
                <PlainInput
                  id="oth"
                  value={state.overtimeHours}
                  onChange={(overtimeHours) => patch({ overtimeHours })}
                />
              </Field>
              <Field label="At multiplier" htmlFor="otm">
                <SuffixInput
                  id="otm"
                  value={state.overtimeMultiplier}
                  onChange={(overtimeMultiplier) =>
                    patch({ overtimeMultiplier })
                  }
                  suffix="×"
                />
              </Field>
            </div>

            <Field
              label="Unpaid days off a year"
              htmlFor="off"
              hint="Days you take without pay"
            >
              <PlainInput
                id="off"
                value={state.unpaidDaysOff}
                onChange={(unpaidDaysOff) => patch({ unpaidDaysOff })}
              />
            </Field>

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              {toSalary
                ? "An hourly rate only becomes a salary once you fix the hours and the weeks. Change either and the annual figure moves."
                : "Salary to hourly is the same sum in reverse: the annual figure spread over the hours you actually work."}
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker={toSalary ? "Annual salary" : "Hourly rate"}
              value={
                toSalary
                  ? formatCurrency(result.annual, true)
                  : formatCurrency(result.hourly)
              }
              unit={toSalary ? "a year, gross" : "an hour, gross"}
              delta={
                <>
                  {result.paidHoursPerYear.toFixed(0)} paid hours a year
                  {result.overtimeAnnual > 0 && (
                    <>
                      <span className="mx-2 text-muted-foreground">·</span>
                      {formatCurrency(result.overtimeAnnual, true)} from overtime
                    </>
                  )}
                </>
              }
              deltaTone="neutral"
            />
            <BreakdownTable
              caption="The same pay, every period"
              captionNote={`${hoursPerWeek} h/wk · ${weeksPerYear} wk/yr`}
              rows={rows}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHead index="03" title="Estimated take-home" note="Optional" />
        <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-start sm:gap-10 sm:px-7">
          <div className="w-full shrink-0 sm:w-52">
            <Field
              label="Your deduction rate"
              htmlFor="tax-rate"
              hint="Leave blank to skip"
            >
              <SuffixInput
                id="tax-rate"
                value={state.taxRate}
                onChange={(taxRate) => patch({ taxRate })}
                suffix="%"
                placeholder="25"
              />
            </Field>
          </div>
          <p className="max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">
              Scenario estimate only.
            </strong>{" "}
            This applies whatever single percentage you type. It is not a tax
            calculation: it uses no tax tables, no withholding rules, and no
            rates for any country or state. Read the rate that actually applies
            to you off your own payslip.
          </p>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, result, taxRate)} />
        <CopyButton
          variant="outline"
          icon={<Link2 className="size-3.5" />}
          idleLabel="Copy share link"
          doneLabel="Link copied"
          getValue={() =>
            `${window.location.origin}${window.location.pathname}?${encode(state)}`
          }
        />
      </div>
    </div>
  );
}

function buildSummary(
  state: State,
  result: ReturnType<typeof computeHourlySalary>,
  taxRate: number | null,
): string {
  const lines: string[] = [];
  lines.push(
    `${formatCurrency(result.hourly)} an hour · ${state.hoursPerWeek} h a week · ${state.weeksPerYear} weeks a year`,
  );
  if (result.overtimeAnnual > 0) {
    lines.push(
      `Overtime: ${state.overtimeHours} h a week at ${state.overtimeMultiplier}x`,
    );
  }
  lines.push("");
  lines.push(`Per year:      ${formatCurrency(result.annual, true)}`);
  lines.push(`Per month:     ${formatCurrency(result.monthly)}`);
  lines.push(`Every 2 weeks: ${formatCurrency(result.biweekly)}`);
  lines.push(`Per week:      ${formatCurrency(result.weekly)}`);
  lines.push(`Per day:       ${formatCurrency(result.daily)}`);
  lines.push(`Per hour:      ${formatCurrency(result.hourly)}`);
  if (taxRate !== null && taxRate > 0 && taxRate < 100) {
    lines.push("");
    lines.push(
      `Est. take-home at ${taxRate}%: ${formatCurrency(applyEstimatedRate(result.annual, taxRate), true)} a year (scenario estimate, not a tax calculation)`,
    );
  }
  lines.push("");
  lines.push("All figures are gross.");
  return lines.join("\n");
}
