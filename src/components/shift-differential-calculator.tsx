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
import { computeShifts, type DifferentialKind, type Shift } from "@/lib/billing";

const MAX_SHIFTS = 5;

interface Row {
  name: string;
  hours: string;
  differential: string;
}

interface State {
  kind: DifferentialKind;
  baseRate: string;
  rows: Row[];
}

const INITIAL: State = {
  kind: "percent",
  baseRate: "20",
  rows: [
    { name: "Day", hours: "24", differential: "0" },
    { name: "Evening", hours: "8", differential: "10" },
    { name: "Night", hours: "8", differential: "15" },
  ],
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("kind", s.kind);
  q.set("base", s.baseRate);
  s.rows.forEach((r, i) => {
    q.set(`n${i}`, r.name);
    q.set(`h${i}`, r.hours);
    q.set(`d${i}`, r.differential);
  });
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("base")) return null;
  const rows: Row[] = [];
  for (let i = 0; i < MAX_SHIFTS; i++) {
    const h = q.get(`h${i}`);
    if (h === null) break;
    rows.push({
      name: q.get(`n${i}`) ?? `Shift ${i + 1}`,
      hours: h,
      differential: q.get(`d${i}`) ?? "0",
    });
  }
  return {
    kind: q.get("kind") === "flat" ? "flat" : "percent",
    baseRate: q.get("base") ?? INITIAL.baseRate,
    rows: rows.length ? rows : INITIAL.rows,
  };
}

export function ShiftDifferentialCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const setRow = (i: number, next: Partial<Row>) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r, j) => (j === i ? { ...r, ...next } : r)),
    }));

  const addRow = () =>
    setState((prev) =>
      prev.rows.length >= MAX_SHIFTS
        ? prev
        : {
            ...prev,
            rows: [
              ...prev.rows,
              { name: `Shift ${prev.rows.length + 1}`, hours: "8", differential: "10" },
            ],
          },
    );

  const removeRow = (i: number) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, j) => j !== i),
    }));

  const baseRate = parseNumber(state.baseRate);
  const isPercent = state.kind === "percent";

  const shifts: Shift[] = state.rows.map((r, i) => ({
    id: `s${i}`,
    name: r.name || `Shift ${i + 1}`,
    hours: parseNumber(r.hours),
    differential: parseNumber(r.differential),
  }));

  const result = computeShifts(baseRate, shifts, state.kind);

  const rows = [
    ...result.lines.map((l) => ({
      label: `${l.shift.name} · ${l.shift.hours} h at ${formatCurrency(l.rate)}/h`,
      value: formatCurrency(l.total),
      note:
        l.premiumPay > 0 ? `+${formatCurrency(l.premiumPay)}` : undefined,
      noteTone: "gain" as const,
    })),
    { label: "Base pay at the plain rate", value: formatCurrency(result.basePay) },
    {
      label: "Differential premium",
      value: formatCurrency(result.premiumPay),
      noteTone: "gain" as const,
    },
    {
      label: "Gross pay",
      value: formatCurrency(result.total, true),
      emphasis: true,
    },
    {
      label: `Blended rate over ${result.totalHours} h`,
      value: `${formatCurrency(result.blendedRate)}/h`,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="Your base rate" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Base hourly rate"
            htmlFor="base"
            hint="Before any shift premium"
          >
            <MoneyInput
              id="base"
              value={state.baseRate}
              onChange={(baseRate) => patch({ baseRate })}
            />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="kicker">Differential is quoted as</span>
            <ModeTabs<DifferentialKind>
              value={state.kind}
              onChange={(kind) => patch({ kind })}
              options={[
                { value: "percent", label: "A percentage" },
                { value: "flat", label: "Dollars per hour" },
              ]}
            />
          </div>
        </div>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            Your shifts
          </h2>
          {state.rows.length < MAX_SHIFTS && (
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-3.5" />
              Add a shift
            </Button>
          )}
        </div>

        <Panel>
          <div className="grid grid-cols-[1fr_6rem_7rem_auto] items-baseline gap-3 px-5 py-3 sm:px-7">
            <span className="kicker">Shift</span>
            <span className="kicker">Hours</span>
            <span className="kicker">Premium</span>
            <span className="kicker w-20 text-right">Rate</span>
          </div>

          {state.rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_6rem_7rem_auto] items-center gap-3 border-t border-[var(--rule)] px-5 py-3 sm:px-7"
            >
              <PlainInput
                ariaLabel={`Shift name ${i + 1}`}
                value={row.name}
                onChange={(name) => setRow(i, { name })}
                className="h-9 font-sans text-base"
              />
              <PlainInput
                ariaLabel={`Hours ${i + 1}`}
                value={row.hours}
                onChange={(hours) => setRow(i, { hours })}
                className="h-9 text-base"
              />
              <div className="flex items-center gap-1">
                <SuffixInput
                  ariaLabel={`Differential ${i + 1}`}
                  value={row.differential}
                  onChange={(differential) => setRow(i, { differential })}
                  suffix={isPercent ? "%" : "$"}
                />
                {state.rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove shift ${i + 1}`}
                    onClick={() => removeRow(i)}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
              <div className="w-20 text-right font-mono text-sm tabular-nums">
                {formatCurrency(result.lines[i]?.rate ?? 0)}
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-3 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <span className="kicker">About differentials</span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A shift differential is a premium for working an unsociable
              shift — nights, evenings, weekends. It is normally quoted either
              as a percentage of your base rate or as a flat amount per hour,
              and which one you are on changes the answer a lot at higher base
              rates.
            </p>
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              The blended rate is what the whole roster averages per hour. It is
              the figure to compare against a job with a higher base rate and no
              differential.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Gross pay"
              value={formatCurrency(result.total, true)}
              unit={`${result.totalHours} hours`}
              delta={
                <>
                  {formatCurrency(result.premiumPay)} of it is differential
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatCurrency(result.blendedRate)}/h blended
                </>
              }
              deltaTone={result.premiumPay > 0 ? "gain" : "neutral"}
            />
            <BreakdownTable
              caption="Shift by shift"
              captionNote={isPercent ? "percentage premium" : "flat premium"}
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
  result: ReturnType<typeof computeShifts>,
  baseRate: number,
): string {
  const lines: string[] = [];
  lines.push(`Base rate: ${formatCurrency(baseRate)}/h`);
  lines.push(
    `Differential quoted as: ${state.kind === "percent" ? "a percentage" : "dollars per hour"}`,
  );
  lines.push("");
  result.lines.forEach((l) => {
    lines.push(
      `  ${l.shift.name.padEnd(12)} ${String(l.shift.hours).padStart(5)} h at ${formatCurrency(l.rate)}/h = ${formatCurrency(l.total)}`,
    );
  });
  lines.push("");
  lines.push(`Base pay:    ${formatCurrency(result.basePay)}`);
  lines.push(`Differential:${formatCurrency(result.premiumPay).padStart(12)}`);
  lines.push(`Gross pay:   ${formatCurrency(result.total, true)}`);
  lines.push(
    `Blended:     ${formatCurrency(result.blendedRate)}/h over ${result.totalHours} hours`,
  );
  return lines.join("\n");
}
