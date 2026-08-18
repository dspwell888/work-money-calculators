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
import { computeFreelanceRate } from "@/lib/rates";

interface State {
  targetIncome: string;
  annualCosts: string;
  profitMargin: string;
  workingDays: string;
  utilisation: string;
  hoursPerDay: string;
}

const INITIAL: State = {
  targetIncome: "80000",
  annualCosts: "10000",
  profitMargin: "0",
  workingDays: "230",
  utilisation: "70",
  hoursPerDay: "8",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("inc", s.targetIncome);
  q.set("cost", s.annualCosts);
  q.set("margin", s.profitMargin);
  q.set("days", s.workingDays);
  q.set("util", s.utilisation);
  q.set("hpd", s.hoursPerDay);
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("inc")) return null;
  return {
    targetIncome: q.get("inc") ?? INITIAL.targetIncome,
    annualCosts: q.get("cost") ?? INITIAL.annualCosts,
    profitMargin: q.get("margin") ?? INITIAL.profitMargin,
    workingDays: q.get("days") ?? INITIAL.workingDays,
    utilisation: q.get("util") ?? INITIAL.utilisation,
    hoursPerDay: q.get("hpd") ?? INITIAL.hoursPerDay,
  };
}

export function FreelanceRateCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const result = computeFreelanceRate({
    targetIncome: parseNumber(state.targetIncome),
    annualCosts: parseNumber(state.annualCosts),
    profitMarginPercent: parseNumber(state.profitMargin),
    workingDays: parseNumber(state.workingDays),
    utilisationPercent: parseNumber(state.utilisation),
    hoursPerDay: parseNumber(state.hoursPerDay),
  });

  const round = (n: number) => Math.round(n * 10) / 10;

  const rows = [
    {
      label: "Income you want to take home",
      value: formatCurrency(parseNumber(state.targetIncome), true),
    },
    {
      label: "Business costs for the year",
      value: formatCurrency(parseNumber(state.annualCosts), true),
    },
    ...(parseNumber(state.profitMargin) > 0
      ? [
          {
            label: `Margin at ${state.profitMargin}%`,
            value: formatCurrency(
              result.requiredRevenue -
                parseNumber(state.targetIncome) -
                parseNumber(state.annualCosts),
              true,
            ),
            noteTone: "gain" as const,
          },
        ]
      : []),
    {
      label: "Revenue you have to bill",
      value: formatCurrency(result.requiredRevenue, true),
      emphasis: true,
    },
    {
      label: "Billable days a year",
      value: `${round(result.billableDays)} days`,
    },
    {
      label: "Days that earn nothing",
      value: `${round(result.nonBillableDays)} days`,
      noteTone: "loss" as const,
    },
    {
      label: "Billable hours a year",
      value: `${round(result.billableHours)} h`,
    },
    { label: "Day rate", value: formatCurrency(result.dayRate) },
    {
      label: "Hourly rate",
      value: formatCurrency(result.hourlyRate),
      emphasis: true,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="What you need to earn" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-3 sm:px-7">
          <Field
            label="Target income"
            htmlFor="inc"
            hint="For yourself, before tax"
          >
            <MoneyInput
              id="inc"
              value={state.targetIncome}
              onChange={(targetIncome) => patch({ targetIncome })}
            />
          </Field>
          <Field
            label="Annual business costs"
            htmlFor="cost"
            hint="Software, insurance, kit, accountant"
          >
            <MoneyInput
              id="cost"
              value={state.annualCosts}
              onChange={(annualCosts) => patch({ annualCosts })}
            />
          </Field>
          <Field
            label="Profit margin"
            htmlFor="margin"
            hint="On top, for reinvestment and risk"
          >
            <SuffixInput
              id="margin"
              value={state.profitMargin}
              onChange={(profitMargin) => patch({ profitMargin })}
              suffix="%"
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <Field
              label="Working days a year"
              htmlFor="days"
              hint="After holiday and public holidays"
            >
              <PlainInput
                id="days"
                value={state.workingDays}
                onChange={(workingDays) => patch({ workingDays })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Utilisation" htmlFor="util">
                <SuffixInput
                  id="util"
                  value={state.utilisation}
                  onChange={(utilisation) => patch({ utilisation })}
                  suffix="%"
                />
              </Field>
              <Field label="Hours a day" htmlFor="hpd">
                <PlainInput
                  id="hpd"
                  value={state.hoursPerDay}
                  onChange={(hoursPerDay) => patch({ hoursPerDay })}
                />
              </Field>
            </div>

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              Utilisation is the share of working days you actually bill.
              Selling, admin, invoicing and learning are all paid for out of the
              days you do bill, which is why a freelance rate is not a salary
              divided by 2,080. Seventy percent is a realistic figure for
              established freelancers; new ones are often nearer fifty.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Rate you need to charge"
              value={formatCurrency(result.hourlyRate)}
              unit="an hour"
              delta={
                <>
                  {formatCurrency(result.dayRate)} a day
                  <span className="mx-2 text-muted-foreground">·</span>
                  {round(result.billableDays)} billable days a year
                </>
              }
              deltaTone="neutral"
            />
            <BreakdownTable
              caption="Working back from the number you want"
              captionNote={`${state.utilisation}% utilisation`}
              rows={rows}
            />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, result)} />
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
  result: ReturnType<typeof computeFreelanceRate>,
): string {
  const lines: string[] = [];
  lines.push(
    `Target income: ${formatCurrency(parseNumber(state.targetIncome), true)}`,
  );
  lines.push(
    `Business costs: ${formatCurrency(parseNumber(state.annualCosts), true)}`,
  );
  if (parseNumber(state.profitMargin) > 0) {
    lines.push(`Margin: ${state.profitMargin}%`);
  }
  lines.push(
    `Capacity: ${state.workingDays} working days at ${state.utilisation}% utilisation, ${state.hoursPerDay} h a day`,
  );
  lines.push("");
  lines.push(
    `  Revenue to bill: ${formatCurrency(result.requiredRevenue, true)}`,
  );
  lines.push(
    `  Billable days:   ${Math.round(result.billableDays * 10) / 10}`,
  );
  lines.push(
    `  Billable hours:  ${Math.round(result.billableHours * 10) / 10}`,
  );
  lines.push("");
  lines.push(`Day rate:    ${formatCurrency(result.dayRate)}`);
  lines.push(`Hourly rate: ${formatCurrency(result.hourlyRate)}`);
  lines.push("");
  lines.push("Gross — tax and any pension provision come out of the income figure.");
  return lines.join("\n");
}
