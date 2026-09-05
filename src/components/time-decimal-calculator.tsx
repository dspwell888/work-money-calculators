"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ChoiceSelect,
  CopyButton,
  Field,
  ModeTabs,
  Panel,
  PanelHead,
  PlainInput,
  useUrlState,
} from "@/components/calc-ui";
import { cn } from "@/lib/utils";
import {
  formatClock,
  formatDecimal,
  formatWords,
  fromDecimalToMinute,
  parseTimeEntry,
  roundDecimal,
  ROUNDING_LABEL,
  ROUNDINGS,
  toDecimal,
  type Rounding,
} from "@/lib/time-decimal";

type Direction = "toDecimal" | "toTime";

const MAX_ROWS = 12;

interface State {
  direction: Direction;
  rounding: Rounding;
  rows: string[];
}

const INITIAL: State = {
  direction: "toDecimal",
  rounding: "none",
  rows: ["7:20"],
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("dir", s.direction);
  if (s.rounding !== "none") q.set("r", s.rounding);
  s.rows.forEach((row, i) => q.set(`t${i}`, row));
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("t0")) return null;
  const rows: string[] = [];
  for (let i = 0; i < MAX_ROWS; i++) {
    const v = q.get(`t${i}`);
    if (v === null) break;
    rows.push(v);
  }
  const dir = q.get("dir");
  const r = q.get("r");
  return {
    direction: dir === "toTime" ? "toTime" : "toDecimal",
    rounding: (ROUNDINGS as readonly string[]).includes(r ?? "")
      ? (r as Rounding)
      : "none",
    rows: rows.length ? rows : INITIAL.rows,
  };
}

/** One parsed row, in both representations. */
interface Row {
  raw: string;
  decimal: number | null;
  rounded: number | null;
}

function parseRow(raw: string, direction: Direction, rounding: Rounding): Row {
  if (direction === "toDecimal") {
    const t = parseTimeEntry(raw);
    if (!t) return { raw, decimal: null, rounded: null };
    const decimal = toDecimal(t);
    return { raw, decimal, rounded: roundDecimal(decimal, rounding) };
  }
  const n = Number(raw.replace(/[^0-9.\-]/g, ""));
  if (!raw.trim() || !Number.isFinite(n)) {
    return { raw, decimal: null, rounded: null };
  }
  return { raw, decimal: n, rounded: roundDecimal(n, rounding) };
}

export function TimeDecimalCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const rows = state.rows.map((r) =>
    parseRow(r, state.direction, state.rounding),
  );
  const valid = rows.filter((r) => r.rounded !== null);
  const total = valid.reduce((sum, r) => sum + (r.rounded ?? 0), 0);
  const multi = state.rows.length > 1;

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const setRow = (i: number, v: string) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r, j) => (j === i ? v : r)),
    }));

  const addRow = () =>
    setState((prev) =>
      prev.rows.length >= MAX_ROWS
        ? prev
        : { ...prev, rows: [...prev.rows, ""] },
    );

  const removeRow = (i: number) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, j) => j !== i),
    }));

  const toDecimalMode = state.direction === "toDecimal";

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="What are you converting?" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <div className="flex flex-col gap-2">
            <span className="kicker">Direction</span>
            <ModeTabs<Direction>
              value={state.direction}
              onChange={(direction) => patch({ direction })}
              options={[
                { value: "toDecimal", label: "Time → decimal" },
                { value: "toTime", label: "Decimal → time" },
              ]}
            />
          </div>
          <Field
            label="Payroll rounding"
            htmlFor="rounding"
            hint="Many employers round each entry before paying it"
          >
            <ChoiceSelect<Rounding>
              id="rounding"
              value={state.rounding}
              onChange={(rounding) => patch({ rounding })}
              options={ROUNDINGS.map((r) => ({
                value: r,
                label: ROUNDING_LABEL[r],
              }))}
            />
          </Field>
        </div>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            {multi ? "Your timesheet" : "Your entry"}
          </h2>
          {state.rows.length < MAX_ROWS && (
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-3.5" />
              Add entry
            </Button>
          )}
        </div>

        <Panel>
          <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 px-5 py-3 sm:px-7">
            <span className="kicker">
              {toDecimalMode ? "Hours and minutes" : "Decimal hours"}
            </span>
            <span className="kicker text-right">
              {toDecimalMode ? "Decimal" : "Hours : minutes"}
            </span>
          </div>

          {state.rows.map((raw, i) => {
            const row = rows[i];
            const invalid = raw.trim() !== "" && row.rounded === null;
            return (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-[var(--rule)] px-5 py-3 sm:px-7"
              >
                <div className="flex items-center gap-2">
                  <PlainInput
                    ariaLabel={`Entry ${i + 1}`}
                    value={raw}
                    onChange={(v) => setRow(i, v)}
                    placeholder={toDecimalMode ? "7:20" : "7.33"}
                    className={cn("h-9 text-base", invalid && "border-loss")}
                  />
                  {multi && (
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
                <div className="text-right font-mono tabular-nums">
                  {invalid ? (
                    <span className="text-sm text-loss">Not a time</span>
                  ) : row.rounded === null ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : toDecimalMode ? (
                    <span>{formatDecimal(row.rounded)}</span>
                  ) : (
                    <span>{formatClock(fromDecimalToMinute(row.rounded))}</span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="rule-t bg-accent/60 px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <span className="kicker">
                {multi ? `Total of ${valid.length} entries` : "Result"}
              </span>
              {state.rounding !== "none" && (
                <span className="kicker">
                  Rounded to {ROUNDING_LABEL[state.rounding].toLowerCase()}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4">
              <span className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] leading-none tracking-tight">
                {toDecimalMode
                  ? formatDecimal(total)
                  : formatClock(fromDecimalToMinute(total))}
              </span>
              <span className="text-sm text-muted-foreground">
                {toDecimalMode ? "decimal hours" : "hours : minutes"}
              </span>
            </div>
            <p className="mt-3 font-mono text-sm tabular-nums text-muted-foreground">
              {toDecimalMode ? (
                <>
                  = {formatClock(fromDecimalToMinute(total))} ={" "}
                  {formatWords(fromDecimalToMinute(total))}
                </>
              ) : (
                <>
                  = {formatDecimal(total)} decimal ={" "}
                  {formatWords(fromDecimalToMinute(total))}
                </>
              )}
              <span className="mx-2">·</span>
              {formatDecimal(total * 60, 0)} minutes
            </p>
          </div>
        </Panel>
      </section>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, rows, total)} />
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

function buildSummary(state: State, rows: Row[], total: number): string {
  const toDecimalMode = state.direction === "toDecimal";
  const lines: string[] = [];
  lines.push(
    toDecimalMode ? "Hours and minutes → decimal" : "Decimal → hours and minutes",
  );
  if (state.rounding !== "none") {
    lines.push(`Rounding: ${ROUNDING_LABEL[state.rounding]}`);
  }
  lines.push("");
  rows.forEach((r, i) => {
    if (r.rounded === null) return;
    const left = r.raw.trim();
    const right = toDecimalMode
      ? `${formatDecimal(r.rounded)} decimal`
      : formatClock(fromDecimalToMinute(r.rounded));
    lines.push(`  ${String(i + 1).padStart(2, "0")}  ${left} = ${right}`);
  });
  lines.push("");
  lines.push(
    `Total: ${formatDecimal(total)} decimal hours = ${formatClock(fromDecimalToMinute(total))} = ${formatDecimal(total * 60, 0)} minutes`,
  );
  return lines.join("\n");
}
