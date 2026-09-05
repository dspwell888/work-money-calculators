"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BreakdownTable,
  ChoiceSelect,
  CopyButton,
  Field,
  Headline,
  MoneyInput,
  Panel,
  PanelHead,
  PlainInput,
  useUrlState,
} from "@/components/calc-ui";
import { cn } from "@/lib/utils";
import { formatCurrency, parseNumber } from "@/lib/salary";
import {
  computeBillable,
  INCREMENT_LABEL,
  INCREMENTS,
  parseDuration,
  type BillableEntry,
  type Increment,
} from "@/lib/billing";

const MAX_ROWS = 12;

interface Row {
  task: string;
  duration: string;
}

interface State {
  increment: Increment;
  hourlyRate: string;
  rows: Row[];
}

const INITIAL: State = {
  increment: "6",
  hourlyRate: "200",
  rows: [
    { task: "Client call", duration: "0:25" },
    { task: "Drafting", duration: "1:35" },
    { task: "Email", duration: "0:08" },
  ],
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("inc", s.increment);
  q.set("rate", s.hourlyRate);
  s.rows.forEach((r, i) => {
    q.set(`d${i}`, r.duration);
    if (r.task) q.set(`t${i}`, r.task);
  });
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("d0")) return null;
  const rows: Row[] = [];
  for (let i = 0; i < MAX_ROWS; i++) {
    const d = q.get(`d${i}`);
    if (d === null) break;
    rows.push({ task: q.get(`t${i}`) ?? "", duration: d });
  }
  const inc = q.get("inc");
  return {
    increment: (INCREMENTS as readonly string[]).includes(inc ?? "")
      ? (inc as Increment)
      : INITIAL.increment,
    hourlyRate: q.get("rate") ?? INITIAL.hourlyRate,
    rows: rows.length ? rows : INITIAL.rows,
  };
}

export function BillableHoursCalculator() {
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
      prev.rows.length >= MAX_ROWS
        ? prev
        : { ...prev, rows: [...prev.rows, { task: "", duration: "" }] },
    );

  const removeRow = (i: number) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, j) => j !== i),
    }));

  const hourlyRate = parseNumber(state.hourlyRate);

  const parsed = state.rows.map((r) => parseDuration(r.duration));
  const entries: BillableEntry[] = state.rows
    .map((r, i) => ({
      id: `e${i}`,
      task: r.task || `Entry ${i + 1}`,
      minutes: parsed[i] ?? 0,
    }))
    .filter((_, i) => parsed[i] !== null);

  const result = computeBillable(entries, state.increment, hourlyRate);

  const rows = [
    ...result.lines.map((l) => ({
      label: `${l.entry.task} · ${l.rawMinutes} min → ${l.billedMinutes} min`,
      value: formatCurrency(l.amount),
      note: `${(Math.round(l.billedHours * 100) / 100).toFixed(2)} h`,
    })),
    {
      label: "Time actually worked",
      value: `${(Math.round(result.rawHours * 100) / 100).toFixed(2)} h`,
    },
    {
      label: "Time billed after rounding",
      value: `${(Math.round(result.billedHours * 100) / 100).toFixed(2)} h`,
      emphasis: true,
    },
    {
      label: "Added by the increment",
      value: `${(Math.round(result.upliftHours * 100) / 100).toFixed(2)} h`,
      note: formatCurrency(result.upliftHours * hourlyRate),
      noteTone: "gain" as const,
    },
    {
      label: "Amount to invoice",
      value: formatCurrency(result.total, true),
      emphasis: true,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="Your billing rule" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Hourly rate"
            htmlFor="rate"
            hint="What you charge per billable hour"
          >
            <MoneyInput
              id="rate"
              value={state.hourlyRate}
              onChange={(hourlyRate) => patch({ hourlyRate })}
            />
          </Field>
          <Field
            label="Minimum billing increment"
            htmlFor="inc"
            hint="Every entry rounds up to this"
          >
            <ChoiceSelect<Increment>
              id="inc"
              value={state.increment}
              onChange={(increment) => patch({ increment })}
              options={INCREMENTS.map((i) => ({
                value: i,
                label: INCREMENT_LABEL[i],
              }))}
            />
          </Field>
        </div>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            Time entries
          </h2>
          {state.rows.length < MAX_ROWS && (
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-3.5" />
              Add entry
            </Button>
          )}
        </div>

        <Panel>
          <div className="grid grid-cols-[1fr_9rem_auto] items-baseline gap-3 px-5 py-3 sm:px-7">
            <span className="kicker">Task</span>
            <span className="kicker">Time</span>
            <span className="kicker w-20 text-right">Billed</span>
          </div>

          {state.rows.map((row, i) => {
            const minutes = parsed[i];
            const invalid = row.duration.trim() !== "" && minutes === null;
            const line = result.lines.find((l) => l.entry.id === `e${i}`);
            return (
              <div
                key={i}
                className="grid grid-cols-[1fr_9rem_auto] items-center gap-3 border-t border-[var(--rule)] px-5 py-3 sm:px-7"
              >
                <PlainInput
                  ariaLabel={`Task ${i + 1}`}
                  value={row.task}
                  onChange={(task) => setRow(i, { task })}
                  placeholder={`Entry ${i + 1}`}
                  className="h-9 font-sans text-base"
                />
                <div className="flex items-center gap-1">
                  <PlainInput
                    ariaLabel={`Duration ${i + 1}`}
                    value={row.duration}
                    onChange={(duration) => setRow(i, { duration })}
                    placeholder="0:25"
                    className={cn("h-9 text-base", invalid && "border-loss")}
                  />
                  {state.rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove entry ${i + 1}`}
                      onClick={() => removeRow(i)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="w-20 text-right font-mono text-sm tabular-nums">
                  {invalid ? (
                    <span className="text-loss">?</span>
                  ) : line ? (
                    <span>{(Math.round(line.billedHours * 100) / 100).toFixed(2)} h</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </Panel>
      </section>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-3 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <span className="kicker">How to type time</span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Any of these work: <code className="font-mono">0:25</code>,{" "}
              <code className="font-mono">25m</code>,{" "}
              <code className="font-mono">1.5</code>,{" "}
              <code className="font-mono">1h30</code>. A row that cannot be read
              is marked rather than counted as zero.
            </p>
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              Every entry rounds <strong className="text-foreground">up</strong>{" "}
              to the increment, one entry at a time. That is the rule that makes
              billable hours different from a timesheet, and the reason a day of
              short tasks bills more than the clock says.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Amount to invoice"
              value={formatCurrency(result.total, true)}
              unit={`${(Math.round(result.billedHours * 100) / 100).toFixed(2)} billable hours`}
              delta={
                <>
                  {(Math.round(result.rawHours * 100) / 100).toFixed(2)} h worked
                  <span className="mx-2 text-muted-foreground">·</span>+
                  {(Math.round(result.upliftHours * 100) / 100).toFixed(2)} h from
                  rounding
                </>
              }
              deltaTone={result.upliftHours > 0 ? "gain" : "neutral"}
            />
            <BreakdownTable
              caption="Entry by entry"
              captionNote={INCREMENT_LABEL[state.increment]}
              rows={rows}
            />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, result, hourlyRate)} />
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
  result: ReturnType<typeof computeBillable>,
  hourlyRate: number,
): string {
  const lines: string[] = [];
  lines.push(
    `Rate: ${formatCurrency(hourlyRate)}/h · Increment: ${INCREMENT_LABEL[state.increment]}`,
  );
  lines.push("");
  result.lines.forEach((l) => {
    lines.push(
      `  ${l.entry.task.padEnd(20)} ${String(l.rawMinutes).padStart(4)} min → ${String(l.billedMinutes).padStart(4)} min = ${formatCurrency(l.amount)}`,
    );
  });
  lines.push("");
  lines.push(`Worked:  ${result.rawHours.toFixed(2)} h`);
  lines.push(`Billed:  ${result.billedHours.toFixed(2)} h`);
  lines.push(`Invoice: ${formatCurrency(result.total, true)}`);
  return lines.join("\n");
}
