"use client";

import * as React from "react";
import { Link2 } from "lucide-react";

import {
  BreakdownTable,
  CopyButton,
  Field,
  Headline,
  MoneyInput,
  Panel,
  PanelHead,
  PlainInput,
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import { formatCurrency, parseNumber } from "@/lib/salary";
import { computePrevailingWage } from "@/lib/comp";

interface State {
  baseRate: string;
  fringeRate: string;
  fringeCredit: string;
  regularHours: string;
  overtimeHours: string;
  overtimeMultiplier: string;
}

const INITIAL: State = {
  baseRate: "35",
  fringeRate: "12",
  fringeCredit: "0",
  regularHours: "40",
  overtimeHours: "0",
  overtimeMultiplier: "1.5",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("base", s.baseRate);
  q.set("fringe", s.fringeRate);
  q.set("credit", s.fringeCredit);
  q.set("h", s.regularHours);
  if (parseNumber(s.overtimeHours) > 0) {
    q.set("oth", s.overtimeHours);
    q.set("otm", s.overtimeMultiplier);
  }
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("base")) return null;
  return {
    baseRate: q.get("base") ?? INITIAL.baseRate,
    fringeRate: q.get("fringe") ?? INITIAL.fringeRate,
    fringeCredit: q.get("credit") ?? "0",
    regularHours: q.get("h") ?? INITIAL.regularHours,
    overtimeHours: q.get("oth") ?? "0",
    overtimeMultiplier: q.get("otm") ?? INITIAL.overtimeMultiplier,
  };
}

export function PrevailingWageCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const baseRate = parseNumber(state.baseRate);
  const fringeRate = parseNumber(state.fringeRate);

  const result = computePrevailingWage({
    baseRate,
    fringeRate,
    fringeCreditPerHour: parseNumber(state.fringeCredit),
    regularHours: parseNumber(state.regularHours),
    overtimeHours: parseNumber(state.overtimeHours),
    overtimeMultiplier: parseNumber(state.overtimeMultiplier) || 1.5,
  });

  const rows = [
    {
      label: `Base · ${state.regularHours} h at ${formatCurrency(baseRate)}`,
      value: formatCurrency(result.regularPay),
    },
    ...(result.overtimePay > 0
      ? [
          {
            label: `Overtime · ${state.overtimeHours} h at ${formatCurrency(baseRate * parseNumber(state.overtimeMultiplier))}`,
            value: formatCurrency(result.overtimePay),
            note: "base rate only",
            noteTone: "gain" as const,
          },
        ]
      : []),
    {
      label: `Fringe owed in cash · ${formatCurrency(result.fringeShortfallPerHour)}/h × ${result.totalHours} h`,
      value: formatCurrency(result.fringeCashOwed),
      noteTone: "gain" as const,
    },
    {
      label: "Cash due",
      value: formatCurrency(result.totalCashDue, true),
      emphasis: true,
    },
    {
      label: "Value of benefits provided",
      value: formatCurrency(result.fringeCreditValue),
    },
    {
      label: "Total package",
      value: formatCurrency(result.totalPackage, true),
      emphasis: true,
    },
    {
      label: `Cash rate over ${result.totalHours} h`,
      value: `${formatCurrency(result.effectiveCashRate)}/h`,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="From your wage determination" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-3 sm:px-7">
          <Field
            label="Basic hourly rate"
            htmlFor="base"
            hint="The determined base rate"
          >
            <MoneyInput
              id="base"
              value={state.baseRate}
              onChange={(baseRate) => patch({ baseRate })}
            />
          </Field>
          <Field
            label="Fringe rate"
            htmlFor="fringe"
            hint="Per hour, from the determination"
          >
            <MoneyInput
              id="fringe"
              value={state.fringeRate}
              onChange={(fringeRate) => patch({ fringeRate })}
            />
          </Field>
          <Field
            label="Benefits provided"
            htmlFor="credit"
            hint="Hourly value of bona fide benefits"
          >
            <MoneyInput
              id="credit"
              value={state.fringeCredit}
              onChange={(fringeCredit) => patch({ fringeCredit })}
            />
          </Field>
        </div>
        <p className="rule-t max-w-prose px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-7">
          <strong className="font-medium text-foreground">
            No rates are looked up here.
          </strong>{" "}
          Prevailing wage rates are set per classification and per locality by
          the issuing authority and change over time. Take the base and fringe
          figures from the wage determination attached to your contract — this
          tool does the arithmetic on them and nothing else.
        </p>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <Field label="Straight-time hours" htmlFor="hours">
              <PlainInput
                id="hours"
                value={state.regularHours}
                onChange={(regularHours) => patch({ regularHours })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Overtime hours" htmlFor="oth">
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

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">The rule that trips people up:</strong>{" "}
              the overtime multiplier applies to the base rate only. The fringe
              rate is owed at straight time for every hour worked, overtime
              hours included — never multiplied.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Cash due"
              value={formatCurrency(result.totalCashDue, true)}
              unit={`${result.totalHours} hours`}
              delta={
                <>
                  {formatCurrency(result.effectiveCashRate)}/h in cash
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatCurrency(result.totalPackage, true)} package including
                  benefits
                </>
              }
              deltaTone="gain"
            />
            <BreakdownTable
              caption="Line by line"
              captionNote={`fringe ${formatCurrency(fringeRate)}/h`}
              rows={rows}
            />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, result, baseRate)} />
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
  result: ReturnType<typeof computePrevailingWage>,
  baseRate: number,
): string {
  const lines: string[] = [];
  lines.push(
    `Determination: ${formatCurrency(baseRate)}/h base + ${formatCurrency(parseNumber(state.fringeRate))}/h fringe`,
  );
  lines.push(
    `Benefits provided: ${formatCurrency(parseNumber(state.fringeCredit))}/h`,
  );
  lines.push("");
  lines.push(
    `  Base      ${state.regularHours} h = ${formatCurrency(result.regularPay)}`,
  );
  if (result.overtimePay > 0) {
    lines.push(
      `  Overtime  ${state.overtimeHours} h at ${state.overtimeMultiplier}x base = ${formatCurrency(result.overtimePay)}`,
    );
  }
  lines.push(
    `  Fringe    ${formatCurrency(result.fringeShortfallPerHour)}/h × ${result.totalHours} h = ${formatCurrency(result.fringeCashOwed)}`,
  );
  lines.push("");
  lines.push(`Cash due:      ${formatCurrency(result.totalCashDue, true)}`);
  lines.push(`Total package: ${formatCurrency(result.totalPackage, true)}`);
  lines.push(
    `Cash rate:     ${formatCurrency(result.effectiveCashRate)}/h over ${result.totalHours} hours`,
  );
  lines.push("");
  lines.push(
    "Rates taken from the wage determination supplied above. Nothing is looked up.",
  );
  return lines.join("\n");
}
