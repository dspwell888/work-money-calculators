"use client";

import * as React from "react";
import { Link2 } from "lucide-react";

import {
  BreakdownTable,
  CopyButton,
  deltaTone,
  Field,
  Headline,
  MoneyInput,
  Panel,
  PanelHead,
  PlainInput,
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import {
  formatCurrency,
  formatPercent,
  formatSigned,
  parseNumber,
} from "@/lib/salary";
import { computeWageInflation } from "@/lib/comp";

interface State {
  startSalary: string;
  endSalary: string;
  years: string;
  inflation: string;
}

const INITIAL: State = {
  startSalary: "60000",
  endSalary: "70000",
  years: "5",
  inflation: "3",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("start", s.startSalary);
  q.set("end", s.endSalary);
  q.set("years", s.years);
  q.set("infl", s.inflation);
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("start")) return null;
  return {
    startSalary: q.get("start") ?? INITIAL.startSalary,
    endSalary: q.get("end") ?? INITIAL.endSalary,
    years: q.get("years") ?? INITIAL.years,
    inflation: q.get("infl") ?? INITIAL.inflation,
  };
}

export function WageInflationCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const startSalary = parseNumber(state.startSalary);
  const result = computeWageInflation({
    startSalary,
    endSalary: parseNumber(state.endSalary),
    years: parseNumber(state.years),
    annualInflationPercent: parseNumber(state.inflation),
  });

  const aheadOfInflation = result.realChange >= 0;

  const rows = [
    {
      label: `Starting salary`,
      value: formatCurrency(startSalary, true),
    },
    {
      label: "Salary now",
      value: formatCurrency(parseNumber(state.endSalary), true),
      note: formatPercent(result.nominalChangePercent),
      noteTone: deltaTone(result.nominalChange),
    },
    {
      label: `Prices rose over ${state.years} years`,
      value: formatPercent(result.cumulativeInflationPercent),
      noteTone: "loss" as const,
    },
    {
      label: "Salary needed just to stand still",
      value: formatCurrency(result.breakEvenSalary, true),
      emphasis: true,
    },
    {
      label: "Ahead of / behind that figure",
      value: formatSigned(result.shortfall),
      noteTone: deltaTone(result.shortfall),
    },
    {
      label: "Salary now, in starting-year money",
      value: formatCurrency(result.realEndSalary, true),
      emphasis: true,
    },
    {
      label: "Real change",
      value: formatSigned(result.realChange),
      note: formatPercent(result.realChangePercent),
      noteTone: deltaTone(result.realChange),
    },
    {
      label: "Nominal growth a year",
      value: formatPercent(result.nominalCagrPercent),
    },
    {
      label: "Real growth a year",
      value: formatPercent(result.realCagrPercent),
      noteTone: deltaTone(result.realCagrPercent),
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="Then and now" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Salary then"
            htmlFor="start"
            hint="What you were on at the start"
          >
            <MoneyInput
              id="start"
              value={state.startSalary}
              onChange={(startSalary) => patch({ startSalary })}
            />
          </Field>
          <Field label="Salary now" htmlFor="end" hint="What you are on today">
            <MoneyInput
              id="end"
              value={state.endSalary}
              onChange={(endSalary) => patch({ endSalary })}
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Years between" htmlFor="years">
                <PlainInput
                  id="years"
                  value={state.years}
                  onChange={(years) => patch({ years })}
                />
              </Field>
              <Field label="Inflation a year" htmlFor="infl">
                <SuffixInput
                  id="infl"
                  value={state.inflation}
                  onChange={(inflation) => patch({ inflation })}
                  suffix="%"
                />
              </Field>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">
                The inflation rate is yours to supply.
              </strong>{" "}
              No index is built in — CPI series differ by country, get revised,
              and would go stale here within a year. Take an average annual
              figure for your period from your national statistics office.
            </p>

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              Compounding matters: 3% a year for five years is not 15%, it is
              15.9%. Over ten years the gap widens further, which is why long
              periods without a raise cost more than they appear to.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker={aheadOfInflation ? "Ahead of inflation" : "Behind inflation"}
              value={formatSigned(result.realChange)}
              unit="in starting-year money"
              delta={
                <>
                  {formatPercent(result.nominalChangePercent)} on paper
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatPercent(result.realChangePercent)} in real terms
                  <span className="mx-2 text-muted-foreground">·</span>
                  prices +{result.cumulativeInflationPercent.toFixed(1)}%
                </>
              }
              deltaTone={deltaTone(result.realChange)}
            />
            <BreakdownTable
              caption="What the raise was really worth"
              captionNote={`${state.inflation}% a year, your figure`}
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
  result: ReturnType<typeof computeWageInflation>,
): string {
  const lines: string[] = [];
  lines.push(
    `${formatCurrency(parseNumber(state.startSalary), true)} → ${formatCurrency(parseNumber(state.endSalary), true)} over ${state.years} years`,
  );
  lines.push(`Inflation assumed: ${state.inflation}% a year (your figure)`);
  lines.push("");
  lines.push(
    `  On paper:        ${formatSigned(result.nominalChange)} (${formatPercent(result.nominalChangePercent)})`,
  );
  lines.push(
    `  Prices rose:     ${formatPercent(result.cumulativeInflationPercent)}`,
  );
  lines.push(
    `  To stand still:  ${formatCurrency(result.breakEvenSalary, true)}`,
  );
  lines.push("");
  lines.push(
    `In starting-year money: ${formatCurrency(result.realEndSalary, true)}`,
  );
  lines.push(
    `Real change:            ${formatSigned(result.realChange)} (${formatPercent(result.realChangePercent)})`,
  );
  lines.push(
    `Real growth a year:     ${formatPercent(result.realCagrPercent)}`,
  );
  return lines.join("\n");
}
