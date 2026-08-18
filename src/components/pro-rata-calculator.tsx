"use client";

import * as React from "react";
import { Link2 } from "lucide-react";

import {
  BreakdownTable,
  ChoiceSelect,
  CopyButton,
  Field,
  Headline,
  ModeTabs,
  MoneyInput,
  Panel,
  PanelHead,
  PlainInput,
  useUrlState,
} from "@/components/calc-ui";
import { formatCurrency, parseNumber } from "@/lib/salary";
import {
  proRataByHours,
  proRataByTerm,
  TERM_UNIT_LABEL,
  TERM_UNIT_TOTAL,
  TERM_UNITS,
  type TermUnit,
} from "@/lib/work-math";

type Basis = "hours" | "term";

interface State {
  basis: Basis;
  fullTimeSalary: string;
  fullTimeHours: string;
  actualHours: string;
  served: string;
  unit: TermUnit;
}

const INITIAL: State = {
  basis: "hours",
  fullTimeSalary: "50000",
  fullTimeHours: "40",
  actualHours: "24",
  served: "7",
  unit: "months",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("basis", s.basis);
  q.set("fts", s.fullTimeSalary);
  if (s.basis === "hours") {
    q.set("fth", s.fullTimeHours);
    q.set("ah", s.actualHours);
  } else {
    q.set("served", s.served);
    q.set("unit", s.unit);
  }
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("fts")) return null;
  const unit = q.get("unit");
  return {
    basis: q.get("basis") === "term" ? "term" : "hours",
    fullTimeSalary: q.get("fts") ?? INITIAL.fullTimeSalary,
    fullTimeHours: q.get("fth") ?? INITIAL.fullTimeHours,
    actualHours: q.get("ah") ?? INITIAL.actualHours,
    served: q.get("served") ?? INITIAL.served,
    unit: (TERM_UNITS as readonly string[]).includes(unit ?? "")
      ? (unit as TermUnit)
      : INITIAL.unit,
  };
}

export function ProRataCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const fullTime = parseNumber(state.fullTimeSalary);
  const byHours = state.basis === "hours";

  const fullTimeHours = parseNumber(state.fullTimeHours);
  const actualHours = parseNumber(state.actualHours);
  const served = parseNumber(state.served);

  const proRata = byHours
    ? proRataByHours({
        fullTimeSalary: fullTime,
        fullTimeHours,
        actualHours,
      })
    : proRataByTerm(fullTime, served, state.unit);

  const fraction = fullTime > 0 ? proRata / fullTime : 0;
  const shortfall = proRata - fullTime;

  const rows = [
    {
      label: "Full-time equivalent",
      value: formatCurrency(fullTime, true),
    },
    {
      label: "Pro rata salary",
      value: formatCurrency(proRata, true),
      emphasis: true,
    },
    {
      label: "Share of full time",
      value: `${(fraction * 100).toFixed(1)}%`,
    },
    {
      label: "Difference",
      value: formatCurrency(shortfall, true),
      noteTone: "loss" as const,
    },
    {
      label: "Per month",
      value: formatCurrency(proRata / 12),
    },
    {
      label: "Per week",
      value: formatCurrency(proRata / 52),
    },
  ];

  if (byHours && actualHours > 0) {
    rows.push({
      label: "Implied hourly rate",
      value: formatCurrency(proRata / (actualHours * 52)),
    });
  }

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="The full-time job" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Full-time salary"
            htmlFor="ft-salary"
            hint="The advertised figure, before any pro rating"
          >
            <MoneyInput
              id="ft-salary"
              value={state.fullTimeSalary}
              onChange={(fullTimeSalary) => patch({ fullTimeSalary })}
            />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="kicker">Pro rate it by</span>
            <ModeTabs<Basis>
              value={state.basis}
              onChange={(basis) => patch({ basis })}
              options={[
                { value: "hours", label: "Hours worked" },
                { value: "term", label: "Time served" },
              ]}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            {byHours ? (
              <>
                <Field label="Full-time hours a week" htmlFor="ft-hours">
                  <PlainInput
                    id="ft-hours"
                    value={state.fullTimeHours}
                    onChange={(fullTimeHours) => patch({ fullTimeHours })}
                  />
                </Field>
                <Field
                  label="Hours you will work"
                  htmlFor="actual-hours"
                  hint="Your contracted part-time hours"
                >
                  <PlainInput
                    id="actual-hours"
                    value={state.actualHours}
                    onChange={(actualHours) => patch({ actualHours })}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Time actually served" htmlFor="served">
                  <PlainInput
                    id="served"
                    value={state.served}
                    onChange={(served) => patch({ served })}
                  />
                </Field>
                <Field
                  label="Counted in"
                  htmlFor="unit"
                  hint={`Out of ${TERM_UNIT_TOTAL[state.unit]} in a full year`}
                >
                  <ChoiceSelect<TermUnit>
                    id="unit"
                    value={state.unit}
                    onChange={(unit) => patch({ unit })}
                    options={TERM_UNITS.map((u) => ({
                      value: u,
                      label: TERM_UNIT_LABEL[u],
                    }))}
                  />
                </Field>
              </>
            )}
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              {byHours
                ? "Use this for a part-time contract: the salary scales with the hours you are contracted to work."
                : "Use this when you join or leave part way through a year: the salary scales with the time you are actually employed."}
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Pro rata salary"
              value={formatCurrency(proRata, true)}
              unit="a year"
              delta={
                <>
                  {(fraction * 100).toFixed(1)}% of full time
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatCurrency(shortfall, true)} against the full-time figure
                </>
              }
              deltaTone="neutral"
            />
            <BreakdownTable
              caption="What that works out to"
              captionNote={
                byHours
                  ? `${actualHours} of ${fullTimeHours} h/wk`
                  : `${served} of ${TERM_UNIT_TOTAL[state.unit]} ${state.unit}`
              }
              rows={rows}
            />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton
          getValue={() => buildSummary(state, proRata, fraction, fullTime)}
        />
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
  proRata: number,
  fraction: number,
  fullTime: number,
): string {
  const lines: string[] = [];
  lines.push(`Full-time salary: ${formatCurrency(fullTime, true)} a year`);
  lines.push(
    state.basis === "hours"
      ? `Basis: ${state.actualHours} hours a week out of a full-time ${state.fullTimeHours}`
      : `Basis: ${state.served} ${state.unit} out of ${TERM_UNIT_TOTAL[state.unit]}`,
  );
  lines.push("");
  lines.push(`Pro rata salary: ${formatCurrency(proRata, true)} a year`);
  lines.push(`  Share of full time: ${(fraction * 100).toFixed(1)}%`);
  lines.push(`  Per month: ${formatCurrency(proRata / 12)}`);
  lines.push(`  Per week: ${formatCurrency(proRata / 52)}`);
  return lines.join("\n");
}
