"use client";

import * as React from "react";
import { Link2, Moon, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import { cn } from "@/lib/utils";
import { formatCurrency, parseNumber } from "@/lib/salary";
import {
  computeTimeCard,
  formatClockDuration,
  formatHours,
  WEEK_START_LABEL,
  WEEK_STARTS,
  type TimeCardEntry,
  type WeekStart,
} from "@/lib/timecard";

const MAX_ROWS = 14;

interface Row {
  date: string;
  start: string;
  end: string;
  breakMinutes: string;
}

interface State {
  hourlyRate: string;
  overtimeThreshold: string;
  overtimeMultiplier: string;
  weekStart: WeekStart;
  rows: Row[];
}

function seedRows(): Row[] {
  const days = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06"];
  return days.map((date) => ({
    date,
    start: "09:00",
    end: "17:30",
    breakMinutes: "30",
  }));
}

const INITIAL: State = {
  hourlyRate: "22",
  overtimeThreshold: "40",
  overtimeMultiplier: "1.5",
  weekStart: "sunday",
  rows: seedRows(),
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("rate", s.hourlyRate);
  q.set("ot", s.overtimeThreshold);
  q.set("otm", s.overtimeMultiplier);
  q.set("ws", s.weekStart);
  s.rows.forEach((r, i) => {
    q.set(`d${i}`, r.date);
    q.set(`s${i}`, r.start);
    q.set(`e${i}`, r.end);
    if (parseNumber(r.breakMinutes) !== 0) q.set(`b${i}`, r.breakMinutes);
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
    rows.push({
      date: d,
      start: q.get(`s${i}`) ?? "09:00",
      end: q.get(`e${i}`) ?? "17:00",
      breakMinutes: q.get(`b${i}`) ?? "0",
    });
  }
  const ws = q.get("ws");
  return {
    hourlyRate: q.get("rate") ?? INITIAL.hourlyRate,
    overtimeThreshold: q.get("ot") ?? INITIAL.overtimeThreshold,
    overtimeMultiplier: q.get("otm") ?? INITIAL.overtimeMultiplier,
    weekStart: (WEEK_STARTS as readonly string[]).includes(ws ?? "")
      ? (ws as WeekStart)
      : INITIAL.weekStart,
    rows: rows.length ? rows : INITIAL.rows,
  };
}

export function TimeCardCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const setRow = (i: number, next: Partial<Row>) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r, j) => (j === i ? { ...r, ...next } : r)),
    }));

  const addRow = () =>
    setState((prev) => {
      if (prev.rows.length >= MAX_ROWS) return prev;
      const last = prev.rows[prev.rows.length - 1];
      // Seed the next row as the following day, which is what a time card does.
      const next = new Date(`${last?.date ?? "2026-03-02"}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      return {
        ...prev,
        rows: [
          ...prev.rows,
          {
            date: Number.isNaN(next.getTime())
              ? ""
              : next.toISOString().slice(0, 10),
            start: last?.start ?? "09:00",
            end: last?.end ?? "17:30",
            breakMinutes: last?.breakMinutes ?? "30",
          },
        ],
      };
    });

  const removeRow = (i: number) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, j) => j !== i),
    }));

  const hourlyRate = parseNumber(state.hourlyRate);
  const entries: TimeCardEntry[] = state.rows.map((r, i) => ({
    id: `r${i}`,
    date: r.date,
    start: r.start,
    end: r.end,
    breakMinutes: parseNumber(r.breakMinutes),
  }));

  const result = computeTimeCard(
    entries,
    hourlyRate,
    parseNumber(state.overtimeThreshold),
    parseNumber(state.overtimeMultiplier) || 1.5,
    state.weekStart,
  );

  const rows = [
    ...result.weeks.map((w) => ({
      label: `Week of ${w.weekStart} · ${formatHours(w.totalMinutes)} h`,
      value: formatCurrency(w.pay),
      note:
        w.overtimeMinutes > 0
          ? `${formatHours(w.overtimeMinutes)} h OT`
          : undefined,
      noteTone: "gain" as const,
    })),
    {
      label: "Regular hours",
      value: `${formatHours(result.regularMinutes)} h`,
      note: formatCurrency(result.regularPay),
    },
    {
      label: `Overtime hours at ${state.overtimeMultiplier}x`,
      value: `${formatHours(result.overtimeMinutes)} h`,
      note: formatCurrency(result.overtimePay),
      noteTone: "gain" as const,
    },
    {
      label: "Total hours",
      value: `${formatHours(result.totalMinutes)} h`,
      note: formatClockDuration(result.totalMinutes),
    },
    {
      label: "Gross pay",
      value: formatCurrency(result.totalPay, true),
      emphasis: true,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="Pay and overtime rule" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-4 sm:px-7">
          <Field label="Hourly rate" htmlFor="rate">
            <MoneyInput
              id="rate"
              value={state.hourlyRate}
              onChange={(hourlyRate) => patch({ hourlyRate })}
            />
          </Field>
          <Field
            label="Overtime after"
            htmlFor="ot"
            hint="Hours per week. 0 for none"
          >
            <SuffixInput
              id="ot"
              value={state.overtimeThreshold}
              onChange={(overtimeThreshold) => patch({ overtimeThreshold })}
              suffix="h"
            />
          </Field>
          <Field label="At multiplier" htmlFor="otm">
            <SuffixInput
              id="otm"
              value={state.overtimeMultiplier}
              onChange={(overtimeMultiplier) => patch({ overtimeMultiplier })}
              suffix="×"
            />
          </Field>
          <Field
            label="Week starts"
            htmlFor="ws"
            hint="Decides which week a shift falls in"
          >
            <ChoiceSelect<WeekStart>
              id="ws"
              value={state.weekStart}
              onChange={(weekStart) => patch({ weekStart })}
              options={WEEK_STARTS.map((w) => ({
                value: w,
                label: WEEK_START_LABEL[w],
              }))}
            />
          </Field>
        </div>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            The card
          </h2>
          {state.rows.length < MAX_ROWS && (
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-3.5" />
              Add a day
            </Button>
          )}
        </div>

        <Panel>
          <div className="overflow-x-auto">
            <div className="min-w-2xl">
              <div className="grid grid-cols-[9rem_6rem_6rem_5rem_auto_2rem] items-baseline gap-3 px-5 py-3 sm:px-7">
                <span className="kicker">Date</span>
                <span className="kicker">In</span>
                <span className="kicker">Out</span>
                <span className="kicker">Break</span>
                <span className="kicker text-right">Worked</span>
                <span />
              </div>

              {state.rows.map((row, i) => {
                const day = result.days[i];
                const unreadable = day?.workedMinutes === null;
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[9rem_6rem_6rem_5rem_auto_2rem] items-center gap-3 border-t border-[var(--rule)] px-5 py-2.5 sm:px-7"
                  >
                    <Input
                      type="date"
                      aria-label={`Date ${i + 1}`}
                      value={row.date}
                      onChange={(e) => setRow(i, { date: e.target.value })}
                      className="h-9 rounded-sm border-0 border-b border-input bg-transparent px-0 font-mono text-sm tabular-nums shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent"
                    />
                    <PlainInput
                      ariaLabel={`Start ${i + 1}`}
                      value={row.start}
                      onChange={(start) => setRow(i, { start })}
                      placeholder="09:00"
                      className={cn("h-9 text-base", unreadable && "border-loss")}
                    />
                    <PlainInput
                      ariaLabel={`End ${i + 1}`}
                      value={row.end}
                      onChange={(end) => setRow(i, { end })}
                      placeholder="17:30"
                      className={cn("h-9 text-base", unreadable && "border-loss")}
                    />
                    <PlainInput
                      ariaLabel={`Break minutes ${i + 1}`}
                      value={row.breakMinutes}
                      onChange={(breakMinutes) => setRow(i, { breakMinutes })}
                      className="h-9 text-base"
                    />
                    <div className="flex items-center justify-end gap-1.5 font-mono text-sm tabular-nums">
                      {day?.crossedMidnight && (
                        <Moon
                          className="size-3.5 text-muted-foreground"
                          aria-label="Crosses midnight"
                        />
                      )}
                      {day?.breakTooLong && (
                        <span className="text-xs text-loss">break &gt; shift</span>
                      )}
                      {unreadable ? (
                        <span className="text-loss">—</span>
                      ) : (
                        <span>{formatHours(day?.workedMinutes ?? 0)} h</span>
                      )}
                    </div>
                    {state.rows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove day ${i + 1}`}
                        onClick={() => removeRow(i)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-3 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <span className="kicker">Two rules worth knowing</span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Night shifts.</strong> When
              the out time is at or before the in time, the shift is treated as
              ending the next day — 22:00 to 06:00 is eight hours. Those rows
              are marked with a moon.
            </p>
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Overtime is weekly.</strong> A
              two-week card is two separate weeks: 50 hours then 30 is ten
              hours of overtime, not none. Averaging across the card would
              understate what you are owed.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Gross pay"
              value={formatCurrency(result.totalPay, true)}
              unit={`${formatHours(result.totalMinutes)} hours`}
              delta={
                <>
                  {result.weeks.length}{" "}
                  {result.weeks.length === 1 ? "week" : "weeks"}
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatHours(result.overtimeMinutes)} h overtime
                </>
              }
              deltaTone={result.overtimeMinutes > 0 ? "gain" : "neutral"}
            />
            <BreakdownTable
              caption="Week by week"
              captionNote={`week starts ${WEEK_START_LABEL[state.weekStart]}`}
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
            `${window.location.origin}${window.location.pathname}#${encode(state)}`
          }
        />
      </div>
    </div>
  );
}

function buildSummary(
  state: State,
  result: ReturnType<typeof computeTimeCard>,
): string {
  const lines: string[] = [];
  lines.push(
    `Rate ${formatCurrency(parseNumber(state.hourlyRate))}/h · overtime after ${state.overtimeThreshold} h a week at ${state.overtimeMultiplier}x · week starts ${WEEK_START_LABEL[state.weekStart]}`,
  );
  lines.push("");
  result.days.forEach((d) => {
    if (d.workedMinutes === null) return;
    lines.push(
      `  ${d.entry.date}  ${d.entry.start}–${d.entry.end}${d.crossedMidnight ? " (+1d)" : "     "}  break ${d.entry.breakMinutes}m  = ${formatHours(d.workedMinutes)} h`,
    );
  });
  lines.push("");
  result.weeks.forEach((w) => {
    lines.push(
      `  Week of ${w.weekStart}: ${formatHours(w.totalMinutes)} h (${formatHours(w.overtimeMinutes)} h OT) = ${formatCurrency(w.pay)}`,
    );
  });
  lines.push("");
  lines.push(`Regular:  ${formatHours(result.regularMinutes)} h`);
  lines.push(`Overtime: ${formatHours(result.overtimeMinutes)} h`);
  lines.push(`Total:    ${formatHours(result.totalMinutes)} h`);
  lines.push(`Gross:    ${formatCurrency(result.totalPay, true)}`);
  return lines.join("\n");
}
