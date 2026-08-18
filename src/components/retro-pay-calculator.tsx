"use client";

import * as React from "react";
import { Link2 } from "lucide-react";

import {
  BreakdownTable,
  CopyButton,
  deltaTone,
  Field,
  Headline,
  ModeTabs,
  MoneyInput,
  Panel,
  PanelHead,
  PlainInput,
  useUrlState,
} from "@/components/calc-ui";
import { formatCurrency, formatPercent, formatSigned, parseNumber } from "@/lib/salary";
import { computeRetroPay, type RetroBasis } from "@/lib/rates";

interface State {
  basis: RetroBasis;
  oldRate: string;
  newRate: string;
  hours: string;
  periods: string;
  periodsPerYear: string;
}

const INITIAL: State = {
  basis: "hourly",
  oldRate: "20",
  newRate: "22.50",
  hours: "320",
  periods: "5",
  periodsPerYear: "26",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("basis", s.basis);
  q.set("old", s.oldRate);
  q.set("new", s.newRate);
  if (s.basis === "hourly") q.set("h", s.hours);
  else {
    q.set("p", s.periods);
    q.set("ppy", s.periodsPerYear);
  }
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("old")) return null;
  return {
    basis: q.get("basis") === "salary" ? "salary" : "hourly",
    oldRate: q.get("old") ?? INITIAL.oldRate,
    newRate: q.get("new") ?? INITIAL.newRate,
    hours: q.get("h") ?? INITIAL.hours,
    periods: q.get("p") ?? INITIAL.periods,
    periodsPerYear: q.get("ppy") ?? INITIAL.periodsPerYear,
  };
}

export function RetroPayCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const hourly = state.basis === "hourly";
  const result = computeRetroPay({
    basis: state.basis,
    oldRate: parseNumber(state.oldRate),
    newRate: parseNumber(state.newRate),
    hours: parseNumber(state.hours),
    periods: parseNumber(state.periods),
    periodsPerYear: parseNumber(state.periodsPerYear),
  });

  const rows = [
    {
      label: hourly ? "Old rate" : "Old salary",
      value: formatCurrency(parseNumber(state.oldRate), !hourly),
    },
    {
      label: hourly ? "New rate" : "New salary",
      value: formatCurrency(parseNumber(state.newRate), !hourly),
    },
    {
      label: "Increase",
      value: formatPercent(result.increasePercent),
      noteTone: deltaTone(result.increasePercent),
    },
    {
      label: hourly ? "Shortfall per hour" : "Shortfall per pay period",
      value: formatSigned(result.differencePerUnit),
      noteTone: deltaTone(result.differencePerUnit),
    },
    {
      label: `Applied to ${result.units} ${result.unitLabel}`,
      value: formatSigned(result.backPay),
      noteTone: deltaTone(result.backPay),
    },
    {
      label: "Back pay owed",
      value: formatCurrency(result.backPay, true),
      emphasis: true,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="The rate change" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label={hourly ? "Old hourly rate" : "Old annual salary"}
            htmlFor="old"
            hint="What you were actually paid"
          >
            <MoneyInput
              id="old"
              value={state.oldRate}
              onChange={(oldRate) => patch({ oldRate })}
            />
          </Field>
          <Field
            label={hourly ? "New hourly rate" : "New annual salary"}
            htmlFor="new"
            hint="What you should have been paid"
          >
            <MoneyInput
              id="new"
              value={state.newRate}
              onChange={(newRate) => patch({ newRate })}
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <ModeTabs<RetroBasis>
              value={state.basis}
              onChange={(basis) => patch({ basis })}
              options={[
                { value: "hourly", label: "Hourly" },
                { value: "salary", label: "Salary" },
              ]}
            />

            {hourly ? (
              <Field
                label="Hours in the retro period"
                htmlFor="hours"
                hint="All hours paid at the old rate"
              >
                <PlainInput
                  id="hours"
                  value={state.hours}
                  onChange={(hours) => patch({ hours })}
                />
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Periods underpaid" htmlFor="periods">
                  <PlainInput
                    id="periods"
                    value={state.periods}
                    onChange={(periods) => patch({ periods })}
                  />
                </Field>
                <Field label="Periods a year" htmlFor="ppy">
                  <PlainInput
                    id="ppy"
                    value={state.periodsPerYear}
                    onChange={(periodsPerYear) => patch({ periodsPerYear })}
                  />
                </Field>
              </div>
            )}

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              {hourly
                ? "Count every hour paid at the old rate, including overtime hours — though overtime owed at the new rate is worth checking separately, since the premium moves too."
                : "Count the pay periods that went out at the old salary. Most US employers run 26 fortnightly periods; monthly payroll is 12."}
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Back pay owed"
              value={formatCurrency(result.backPay, true)}
              unit="gross"
              delta={
                <>
                  {formatSigned(result.differencePerUnit)} ×{" "}
                  {result.units} {result.unitLabel}
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatPercent(result.increasePercent)} raise
                </>
              }
              deltaTone={deltaTone(result.backPay)}
            />
            <BreakdownTable caption="How it adds up" rows={rows} />
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
  result: ReturnType<typeof computeRetroPay>,
): string {
  const hourly = state.basis === "hourly";
  const lines: string[] = [];
  lines.push(
    `${hourly ? "Hourly" : "Salary"} retro pay: ${formatCurrency(parseNumber(state.oldRate), !hourly)} → ${formatCurrency(parseNumber(state.newRate), !hourly)} (${formatPercent(result.increasePercent)})`,
  );
  lines.push("");
  lines.push(
    `  Shortfall per ${hourly ? "hour" : "pay period"}: ${formatSigned(result.differencePerUnit)}`,
  );
  lines.push(`  Applied to: ${result.units} ${result.unitLabel}`);
  lines.push("");
  lines.push(`Back pay owed: ${formatCurrency(result.backPay, true)} gross`);
  return lines.join("\n");
}
