"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { formatCurrency, parseNumber } from "@/lib/salary";
import {
  percentileFromBreakpoints,
  percentileFromList,
  type Breakpoint,
} from "@/lib/comp";

type Mode = "survey" | "list";

const MAX_POINTS = 8;

interface State {
  mode: Mode;
  salary: string;
  points: { percentile: string; salary: string }[];
  list: string;
}

const INITIAL: State = {
  mode: "survey",
  salary: "82000",
  points: [
    { percentile: "25", salary: "60000" },
    { percentile: "50", salary: "75000" },
    { percentile: "75", salary: "92000" },
    { percentile: "90", salary: "110000" },
  ],
  list: "58000, 62000, 71000, 75000, 78000, 84000, 96000",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("mode", s.mode);
  q.set("sal", s.salary);
  if (s.mode === "survey") {
    s.points.forEach((p, i) => {
      q.set(`p${i}`, p.percentile);
      q.set(`v${i}`, p.salary);
    });
  } else {
    q.set("list", s.list);
  }
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("sal")) return null;
  const points: { percentile: string; salary: string }[] = [];
  for (let i = 0; i < MAX_POINTS; i++) {
    const v = q.get(`v${i}`);
    if (v === null) break;
    points.push({ percentile: q.get(`p${i}`) ?? "50", salary: v });
  }
  return {
    mode: q.get("mode") === "list" ? "list" : "survey",
    salary: q.get("sal") ?? INITIAL.salary,
    points: points.length ? points : INITIAL.points,
    list: q.get("list") ?? INITIAL.list,
  };
}

export function SalaryPercentileCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const setPoint = (
    i: number,
    next: Partial<{ percentile: string; salary: string }>,
  ) =>
    setState((prev) => ({
      ...prev,
      points: prev.points.map((p, j) => (j === i ? { ...p, ...next } : p)),
    }));

  const addPoint = () =>
    setState((prev) =>
      prev.points.length >= MAX_POINTS
        ? prev
        : { ...prev, points: [...prev.points, { percentile: "95", salary: "0" }] },
    );

  const removePoint = (i: number) =>
    setState((prev) => ({
      ...prev,
      points: prev.points.filter((_, j) => j !== i),
    }));

  const salary = parseNumber(state.salary);
  const survey = state.mode === "survey";

  const breakpoints: Breakpoint[] = state.points.map((p, i) => ({
    id: `b${i}`,
    percentile: parseNumber(p.percentile),
    salary: parseNumber(p.salary),
  }));

  const listValues = state.list
    .split(/[\s,;]+/)
    .map((v) => parseNumber(v))
    .filter((v) => v > 0);

  const fromSurvey = percentileFromBreakpoints(breakpoints, salary);
  const fromList = percentileFromList(listValues, salary);

  const percentile = survey ? fromSurvey?.percentile : fromList?.percentile;
  const compa = survey ? fromSurvey?.compaRatio : fromList?.compaRatio;
  const median = survey ? fromSurvey?.median : fromList?.median;
  const clamped = survey ? (fromSurvey?.clamped ?? false) : false;

  const rows = survey
    ? [
        ...breakpoints
          .filter((b) => b.salary > 0)
          .sort((a, b) => a.percentile - b.percentile)
          .map((b) => ({
            label: `p${b.percentile}`,
            value: formatCurrency(b.salary, true),
            note:
              salary >= b.salary ? "at or above" : "below",
            noteTone: (salary >= b.salary ? "gain" : "neutral") as
              | "gain"
              | "neutral",
          })),
        {
          label: "Your salary",
          value: formatCurrency(salary, true),
          emphasis: true,
        },
        ...(fromSurvey?.lower && fromSurvey?.upper
          ? [
              {
                label: `Interpolated between p${fromSurvey.lower.percentile} and p${fromSurvey.upper.percentile}`,
                value: `p${(percentile ?? 0).toFixed(1)}`,
              },
            ]
          : []),
        ...(median
          ? [
              {
                label: "Compa-ratio against p50",
                value: (compa ?? 0).toFixed(2),
              },
            ]
          : []),
      ]
    : [
        { label: "Salaries in the set", value: String(fromList?.count ?? 0) },
        {
          label: "Below yours",
          value: String(fromList?.below ?? 0),
        },
        {
          label: "Equal to yours",
          value: String(fromList?.equal ?? 0),
        },
        {
          label: "Above yours",
          value: String(fromList?.above ?? 0),
          noteTone: "loss" as const,
        },
        {
          label: "Lowest / highest",
          value: `${formatCurrency(fromList?.min ?? 0, true)} – ${formatCurrency(fromList?.max ?? 0, true)}`,
        },
        {
          label: "Median of the set",
          value: formatCurrency(fromList?.median ?? 0, true),
        },
        {
          label: "Compa-ratio against the median",
          value: (compa ?? 0).toFixed(2),
          emphasis: true,
        },
      ];

  const hasResult = percentile !== undefined;

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="The salary you are placing" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field label="Salary" htmlFor="salary" hint="Base, per year">
            <MoneyInput
              id="salary"
              value={state.salary}
              onChange={(s) => patch({ salary: s })}
            />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="kicker">Compare against</span>
            <ModeTabs<Mode>
              value={state.mode}
              onChange={(mode) => patch({ mode })}
              options={[
                { value: "survey", label: "Survey breakpoints" },
                { value: "list", label: "A list of salaries" },
              ]}
            />
          </div>
        </div>
        <p className="rule-t max-w-prose px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-7">
          <strong className="font-medium text-foreground">
            No market data is built in.
          </strong>{" "}
          This tool has no idea what your role pays — it places a salary inside
          numbers <em>you</em> supply, from a published survey, your own team, or
          offers you have collected. Any calculator claiming to know your
          market percentile without asking where the data came from is guessing.
        </p>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            {survey ? "Your survey breakpoints" : "Your salary set"}
          </h2>
          {survey && state.points.length < MAX_POINTS && (
            <Button variant="outline" size="sm" onClick={addPoint}>
              <Plus className="size-3.5" />
              Add a point
            </Button>
          )}
        </div>

        <Panel>
          {survey ? (
            <>
              <div className="grid grid-cols-[7rem_1fr_2rem] items-baseline gap-3 px-5 py-3 sm:px-7">
                <span className="kicker">Percentile</span>
                <span className="kicker">Salary</span>
                <span />
              </div>
              {state.points.map((p, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 border-t border-[var(--rule)] px-5 py-3 sm:px-7"
                >
                  <SuffixInput
                    ariaLabel={`Percentile ${i + 1}`}
                    value={p.percentile}
                    onChange={(percentile) => setPoint(i, { percentile })}
                    suffix="p"
                  />
                  <MoneyInput
                    ariaLabel={`Salary at breakpoint ${i + 1}`}
                    value={p.salary}
                    onChange={(s) => setPoint(i, { salary: s })}
                    className="h-9 text-base"
                  />
                  {state.points.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove point ${i + 1}`}
                      onClick={() => removePoint(i)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col gap-2 px-5 py-6 sm:px-7">
              <Field
                label="Salaries, separated by commas"
                htmlFor="list"
                hint={`${listValues.length} usable ${listValues.length === 1 ? "figure" : "figures"} found`}
              >
                <PlainInput
                  id="list"
                  value={state.list}
                  onChange={(list) => patch({ list })}
                  className="h-11 font-mono text-base"
                />
              </Field>
            </div>
          )}
        </Panel>
      </section>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-3 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <span className="kicker">Reading the result</span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A percentile of 60 means 60% of the set earns less than you. A
              compa-ratio of 1.00 means you are exactly at the median; 0.90
              means ten percent below it.
            </p>
            {clamped && (
              <p className="text-xs leading-relaxed text-loss">
                Your salary sits outside the surveyed range, so the percentile
                is clamped to the nearest breakpoint. A survey that stops at
                p90 cannot tell you whether you are at p91 or p99.
              </p>
            )}
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              Between breakpoints the figure is interpolated in a straight
              line. Real salary distributions are not straight lines, so treat
              a mid-band percentile as approximate.
            </p>
          </div>

          <div className="flex flex-col">
            {hasResult ? (
              <Headline
                kicker="Percentile"
                value={`p${(percentile ?? 0).toFixed(1)}`}
                unit={clamped ? "at the edge of the data" : "of the set you supplied"}
                delta={
                  <>
                    compa-ratio {(compa ?? 0).toFixed(2)}
                    {median ? (
                      <>
                        <span className="mx-2 text-muted-foreground">·</span>
                        median {formatCurrency(median, true)}
                      </>
                    ) : null}
                  </>
                }
                deltaTone={(compa ?? 0) >= 1 ? "gain" : "loss"}
              />
            ) : (
              <div className="px-5 py-6 sm:px-7">
                <span className="kicker">Percentile</span>
                <p className="mt-2 text-sm text-loss">
                  Add at least one salary to compare against.
                </p>
              </div>
            )}
            <BreakdownTable
              caption={survey ? "Against your breakpoints" : "Against your set"}
              rows={rows}
            />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton
          getValue={() =>
            buildSummary(state, salary, percentile, compa, median, clamped)
          }
        />
        <CopyButton
          variant="outline"
          icon={<Link2 className="size-3.5" />}
          idleLabel="Copy share link"
          doneLabel="Link copied"
          getValue={() =>
            `${window.location.origin}${window.location.pathname}#${encode(state)}`
          }
        />
      </div>
    </div>
  );
}

function buildSummary(
  state: State,
  salary: number,
  percentile: number | undefined,
  compa: number | undefined,
  median: number | null | undefined,
  clamped: boolean,
): string {
  const lines: string[] = [];
  lines.push(`Salary: ${formatCurrency(salary, true)}`);
  lines.push(
    state.mode === "survey"
      ? "Compared against survey breakpoints:"
      : "Compared against a supplied list of salaries:",
  );
  if (state.mode === "survey") {
    state.points.forEach((p) => {
      lines.push(
        `  p${p.percentile.padStart(2)} = ${formatCurrency(parseNumber(p.salary), true)}`,
      );
    });
  } else {
    lines.push(`  ${state.list}`);
  }
  lines.push("");
  lines.push(
    `Percentile: p${(percentile ?? 0).toFixed(1)}${clamped ? " (clamped — outside the surveyed range)" : ""}`,
  );
  if (median) {
    lines.push(`Median:     ${formatCurrency(median, true)}`);
    lines.push(`Compa-ratio: ${(compa ?? 0).toFixed(2)}`);
  }
  lines.push("");
  lines.push("Based only on the figures supplied above. No market data is built in.");
  return lines.join("\n");
}
