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
  Panel,
  PanelHead,
  PlainInput,
  useUrlState,
} from "@/components/calc-ui";
import { cn } from "@/lib/utils";
import {
  clockDifference,
  formatClock,
  formatDecimal,
  formatWords,
  fromDecimalToMinute,
  sumSignedDurations,
  type DurationSign,
  type SignedDuration,
} from "@/lib/time-decimal";

type Mode = "add" | "between";

const MAX_ROWS = 10;

interface State {
  mode: Mode;
  rows: { sign: DurationSign; raw: string }[];
  from: string;
  to: string;
}

const INITIAL: State = {
  mode: "add",
  rows: [
    { sign: "+", raw: "2:45" },
    { sign: "+", raw: "1:30" },
    { sign: "-", raw: "0:20" },
  ],
  from: "09:00",
  to: "17:30",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("mode", s.mode);
  if (s.mode === "add") {
    s.rows.forEach((r, i) => {
      q.set(`s${i}`, r.sign);
      q.set(`v${i}`, r.raw);
    });
  } else {
    q.set("from", s.from);
    q.set("to", s.to);
  }
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("mode")) return null;
  const rows: { sign: DurationSign; raw: string }[] = [];
  for (let i = 0; i < MAX_ROWS; i++) {
    const v = q.get(`v${i}`);
    if (v === null) break;
    rows.push({ sign: q.get(`s${i}`) === "-" ? "-" : "+", raw: v });
  }
  return {
    mode: q.get("mode") === "between" ? "between" : "add",
    rows: rows.length ? rows : INITIAL.rows,
    from: q.get("from") ?? INITIAL.from,
    to: q.get("to") ?? INITIAL.to,
  };
}

export function HoursMinutesCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const setRow = (i: number, next: Partial<{ sign: DurationSign; raw: string }>) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r, j) => (j === i ? { ...r, ...next } : r)),
    }));

  const addRow = () =>
    setState((prev) =>
      prev.rows.length >= MAX_ROWS
        ? prev
        : { ...prev, rows: [...prev.rows, { sign: "+", raw: "" }] },
    );

  const removeRow = (i: number) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, j) => j !== i),
    }));

  const adding = state.mode === "add";

  const entries: SignedDuration[] = state.rows.map((r, i) => ({
    id: `d${i}`,
    sign: r.sign,
    raw: r.raw,
  }));
  const sum = sumSignedDurations(entries);
  const between = clockDifference(state.from, state.to);

  const total = adding ? sum.total : (between ?? 0);
  const crossesMidnight =
    !adding && between !== null && state.to <= state.from;

  const rows = adding
    ? [
        ...sum.lines
          .filter((l) => l.decimal !== null)
          .map((l, i) => ({
            label: `${l.entry.sign === "-" ? "−" : "+"} ${l.entry.raw}`,
            value: formatClock(fromDecimalToMinute(l.runningTotal)),
            note: `${formatDecimal(l.decimal ?? 0)} h`,
            emphasis: i === sum.counted - 1,
          })),
        {
          label: "Total in decimal hours",
          value: formatDecimal(total),
        },
        {
          label: "Total in minutes",
          value: `${Math.round(total * 60)} min`,
        },
      ]
    : [
        { label: "From", value: state.from },
        { label: "To", value: state.to },
        ...(crossesMidnight
          ? [
              {
                label: "Crosses midnight",
                value: "next day",
                noteTone: "neutral" as const,
              },
            ]
          : []),
        {
          label: "Elapsed",
          value: formatClock(fromDecimalToMinute(total)),
          emphasis: true,
        },
        { label: "In decimal hours", value: formatDecimal(total) },
        { label: "In minutes", value: `${Math.round(total * 60)} min` },
      ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="What are you working out?" />
        <div className="flex flex-col gap-2 px-5 py-6 sm:px-7">
          <span className="kicker">Mode</span>
          <ModeTabs<Mode>
            value={state.mode}
            onChange={(mode) => patch({ mode })}
            options={[
              { value: "add", label: "Add and subtract times" },
              { value: "between", label: "Time between two clocks" },
            ]}
          />
        </div>
      </Panel>

      {adding ? (
        <section className="flex flex-col gap-5">
          <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
            <h2 className="font-heading text-xl">
              <span className="kicker mr-3 align-middle">02</span>
              The sum
            </h2>
            {state.rows.length < MAX_ROWS && (
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-3.5" />
                Add a time
              </Button>
            )}
          </div>

          <Panel>
            {state.rows.map((row, i) => {
              const line = sum.lines[i];
              const invalid = row.raw.trim() !== "" && line.decimal === null;
              return (
                <div
                  key={i}
                  className={cn(
                    "grid grid-cols-[5rem_1fr_auto_2rem] items-center gap-3 px-5 py-3 sm:px-7",
                    i > 0 && "border-t border-[var(--rule)]",
                  )}
                >
                  <div className="flex gap-1">
                    {(["+", "-"] as DurationSign[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRow(i, { sign: s })}
                        aria-pressed={row.sign === s}
                        aria-label={s === "+" ? `Add row ${i + 1}` : `Subtract row ${i + 1}`}
                        className={cn(
                          "size-8 rounded-sm border font-mono text-sm transition-colors",
                          row.sign === s
                            ? "border-foreground bg-foreground text-background"
                            : "border-[var(--rule)] text-muted-foreground hover:border-foreground hover:text-foreground",
                        )}
                      >
                        {s === "+" ? "+" : "−"}
                      </button>
                    ))}
                  </div>
                  <PlainInput
                    ariaLabel={`Time ${i + 1}`}
                    value={row.raw}
                    onChange={(raw) => setRow(i, { raw })}
                    placeholder="2:45"
                    className={cn("h-9 text-base", invalid && "border-loss")}
                  />
                  <div className="text-right font-mono text-sm tabular-nums">
                    {invalid ? (
                      <span className="text-loss">not a time</span>
                    ) : line.decimal === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatClock(fromDecimalToMinute(line.runningTotal))}
                      </span>
                    )}
                  </div>
                  {state.rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove row ${i + 1}`}
                      onClick={() => removeRow(i)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </Panel>
        </section>
      ) : (
        <Panel>
          <PanelHead index="02" title="Between two clock times" />
          <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
            <Field label="From" htmlFor="from" hint="24-hour, e.g. 22:00">
              <PlainInput
                id="from"
                value={state.from}
                onChange={(from) => patch({ from })}
              />
            </Field>
            <Field label="To" htmlFor="to" hint="Earlier than From means next day">
              <PlainInput
                id="to"
                value={state.to}
                onChange={(to) => patch({ to })}
              />
            </Field>
          </div>
        </Panel>
      )}

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-3 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <span className="kicker">How to type a time</span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <code className="font-mono">2:45</code>,{" "}
              <code className="font-mono">2h45</code>,{" "}
              <code className="font-mono">165m</code> and{" "}
              <code className="font-mono">2.75</code> all mean the same thing. A
              row that cannot be read is flagged rather than counted as zero.
            </p>
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              A negative total is shown as a negative, not clamped — subtracting
              a longer time is a normal thing to want to do.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker={adding ? "Total" : "Time between"}
              value={formatClock(fromDecimalToMinute(total))}
              unit="hours : minutes"
              delta={
                <>
                  {formatDecimal(total)} decimal hours
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatWords(fromDecimalToMinute(total))}
                  {crossesMidnight && (
                    <>
                      <span className="mx-2 text-muted-foreground">·</span>
                      crosses midnight
                    </>
                  )}
                </>
              }
              deltaTone={total < 0 ? "loss" : "neutral"}
            />
            <BreakdownTable
              caption={adding ? "Running total" : "The working"}
              rows={rows}
            />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, sum, total)} />
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
  sum: ReturnType<typeof sumSignedDurations>,
  total: number,
): string {
  const lines: string[] = [];
  if (state.mode === "add") {
    sum.lines.forEach((l) => {
      if (l.decimal === null) return;
      lines.push(
        `  ${l.entry.sign === "-" ? "−" : "+"} ${l.entry.raw.padEnd(8)} → ${formatClock(fromDecimalToMinute(l.runningTotal))}`,
      );
    });
  } else {
    lines.push(`  From ${state.from} to ${state.to}`);
  }
  lines.push("");
  lines.push(
    `Total: ${formatClock(fromDecimalToMinute(total))} = ${formatDecimal(total)} decimal hours = ${Math.round(total * 60)} minutes`,
  );
  return lines.join("\n");
}
