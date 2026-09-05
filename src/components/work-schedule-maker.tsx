"use client";

import * as React from "react";
import { Download, Link2, Moon, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CopyButton,
  Field,
  Panel,
  PanelHead,
  PlainInput,
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import { cn } from "@/lib/utils";
import { formatCurrency, parseNumber } from "@/lib/salary";
import { formatHours } from "@/lib/timecard";
import {
  computeSchedule,
  OFF,
  scheduleDates,
  shiftHours,
  toCsv,
  weekdayOf,
  type Employee,
  type ShiftTemplate,
} from "@/lib/schedule";

const MAX_STAFF = 12;
const MAX_TEMPLATES = 6;
const DAY_COUNTS = [7, 14] as const;

interface State {
  startDate: string;
  dayCount: number;
  overtimeThreshold: string;
  overtimeMultiplier: string;
  templates: { code: string; label: string; start: string; end: string; brk: string }[];
  staff: { name: string; rate: string; days: string[] }[];
}

const DEFAULT_TEMPLATES = [
  { code: "E", label: "Early", start: "07:00", end: "15:00", brk: "30" },
  { code: "L", label: "Late", start: "15:00", end: "23:00", brk: "30" },
  { code: "N", label: "Night", start: "23:00", end: "07:00", brk: "60" },
];

const INITIAL: State = {
  startDate: "2026-03-01",
  dayCount: 7,
  overtimeThreshold: "40",
  overtimeMultiplier: "1.5",
  templates: DEFAULT_TEMPLATES,
  staff: [
    { name: "Ana", rate: "20", days: "EEEEE--".split("") },
    { name: "Ben", rate: "22", days: "LLL-EE-".split("") },
    { name: "Cara", rate: "25", days: "--NNN--".split("") },
  ],
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("sd", s.startDate);
  q.set("n", String(s.dayCount));
  q.set("ot", s.overtimeThreshold);
  q.set("otm", s.overtimeMultiplier);
  s.templates.forEach((t, i) => {
    q.set(`t${i}`, [t.code, t.label, t.start, t.end, t.brk].join("~"));
  });
  s.staff.forEach((p, i) => {
    // Codes are single characters, so the week packs into one short token.
    q.set(`e${i}`, [p.name, p.rate, p.days.join("")].join("~"));
  });
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("e0")) return null;

  const templates: State["templates"] = [];
  for (let i = 0; i < MAX_TEMPLATES; i++) {
    const raw = q.get(`t${i}`);
    if (raw === null) break;
    const [code, label, start, end, brk] = raw.split("~");
    templates.push({
      code: (code || "?").slice(0, 1),
      label: label ?? "Shift",
      start: start ?? "09:00",
      end: end ?? "17:00",
      brk: brk ?? "0",
    });
  }

  const dayCount = Number(q.get("n")) === 14 ? 14 : 7;
  const staff: State["staff"] = [];
  for (let i = 0; i < MAX_STAFF; i++) {
    const raw = q.get(`e${i}`);
    if (raw === null) break;
    const [name, rate, days] = raw.split("~");
    const chars = (days ?? "").split("");
    staff.push({
      name: name ?? `Person ${i + 1}`,
      rate: rate ?? "20",
      days: Array.from({ length: dayCount }, (_, d) => chars[d] ?? OFF),
    });
  }

  return {
    startDate: q.get("sd") ?? INITIAL.startDate,
    dayCount,
    overtimeThreshold: q.get("ot") ?? INITIAL.overtimeThreshold,
    overtimeMultiplier: q.get("otm") ?? INITIAL.overtimeMultiplier,
    templates: templates.length ? templates : INITIAL.templates,
    staff: staff.length ? staff : INITIAL.staff,
  };
}

export function WorkScheduleMaker() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  /* ---- templates ---- */

  const setTemplate = (i: number, next: Partial<State["templates"][number]>) =>
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((t, j) =>
        j === i ? { ...t, ...next } : t,
      ),
    }));

  const addTemplate = () =>
    setState((prev) => {
      if (prev.templates.length >= MAX_TEMPLATES) return prev;
      const used = new Set(prev.templates.map((t) => t.code));
      const code =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((c) => !used.has(c)) ?? "X";
      return {
        ...prev,
        templates: [
          ...prev.templates,
          { code, label: "New shift", start: "09:00", end: "17:00", brk: "30" },
        ],
      };
    });

  const removeTemplate = (i: number) =>
    setState((prev) => {
      const gone = prev.templates[i]?.code;
      return {
        ...prev,
        templates: prev.templates.filter((_, j) => j !== i),
        // Anyone assigned the deleted shift falls back to a day off, rather
        // than silently keeping a code that no longer means anything.
        staff: prev.staff.map((p) => ({
          ...p,
          days: p.days.map((d) => (d === gone ? OFF : d)),
        })),
      };
    });

  /* ---- staff ---- */

  const setStaff = (i: number, next: Partial<State["staff"][number]>) =>
    setState((prev) => ({
      ...prev,
      staff: prev.staff.map((p, j) => (j === i ? { ...p, ...next } : p)),
    }));

  const setCell = (personIndex: number, dayIndex: number, code: string) =>
    setState((prev) => ({
      ...prev,
      staff: prev.staff.map((p, j) =>
        j === personIndex
          ? { ...p, days: p.days.map((d, k) => (k === dayIndex ? code : d)) }
          : p,
      ),
    }));

  const addStaff = () =>
    setState((prev) =>
      prev.staff.length >= MAX_STAFF
        ? prev
        : {
            ...prev,
            staff: [
              ...prev.staff,
              {
                name: `Person ${prev.staff.length + 1}`,
                rate: "20",
                days: Array.from({ length: prev.dayCount }, () => OFF),
              },
            ],
          },
    );

  const removeStaff = (i: number) =>
    setState((prev) => ({
      ...prev,
      staff: prev.staff.filter((_, j) => j !== i),
    }));

  const setDayCount = (n: number) =>
    setState((prev) => ({
      ...prev,
      dayCount: n,
      staff: prev.staff.map((p) => ({
        ...p,
        days: Array.from({ length: n }, (_, d) => p.days[d] ?? OFF),
      })),
    }));

  /* ---- compute ---- */

  const templates: ShiftTemplate[] = state.templates.map((t) => ({
    code: t.code,
    label: t.label,
    start: t.start,
    end: t.end,
    breakMinutes: parseNumber(t.brk),
  }));

  const employees: Employee[] = state.staff.map((p, i) => ({
    id: `p${i}`,
    name: p.name || `Person ${i + 1}`,
    hourlyRate: parseNumber(p.rate),
    days: p.days,
  }));

  const result = computeSchedule(
    employees,
    templates,
    state.startDate,
    state.dayCount,
    parseNumber(state.overtimeThreshold),
    parseNumber(state.overtimeMultiplier) || 1.5,
  );

  const dates = scheduleDates(state.startDate, state.dayCount);
  const templateHours = templates.map(shiftHours);
  const threshold = parseNumber(state.overtimeThreshold);

  const downloadCsv = () => {
    const csv = toCsv(result, templates, dates);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-${state.startDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-12">
      {/* ---- 01 setup ---- */}
      <Panel>
        <PanelHead index="01" title="The roster period" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-4 sm:px-7">
          <Field
            label="Starts"
            htmlFor="sd"
            hint="Set this to your workweek start"
          >
            <Input
              id="sd"
              type="date"
              value={state.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
              className="h-11 rounded-sm border-0 border-b border-input bg-transparent px-0 font-mono text-base tabular-nums shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent"
            />
          </Field>
          <Field label="Length" htmlFor="len" hint="One or two weeks">
            <div className="flex gap-1.5 pt-2">
              {DAY_COUNTS.map((n) => (
                <button
                  key={n}
                  id={n === 7 ? "len" : undefined}
                  type="button"
                  onClick={() => setDayCount(n)}
                  aria-pressed={state.dayCount === n}
                  className={cn(
                    "rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors",
                    state.dayCount === n
                      ? "border-foreground bg-foreground text-background"
                      : "border-[var(--rule)] text-muted-foreground hover:border-foreground hover:text-foreground",
                  )}
                >
                  {n} days
                </button>
              ))}
            </div>
          </Field>
          <Field label="Overtime after" htmlFor="ot" hint="Hours a week. 0 for none">
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
        </div>
      </Panel>

      {/* ---- 02 shift library ---- */}
      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            Shift library
          </h2>
          {state.templates.length < MAX_TEMPLATES && (
            <Button variant="outline" size="sm" onClick={addTemplate}>
              <Plus className="size-3.5" />
              Add a shift
            </Button>
          )}
        </div>

        <Panel>
          <div className="overflow-x-auto">
            <div className="min-w-2xl">
              <div className="grid grid-cols-[3rem_1fr_6rem_6rem_5rem_5rem_2rem] items-baseline gap-3 px-5 py-3 sm:px-7">
                <span className="kicker">Code</span>
                <span className="kicker">Name</span>
                <span className="kicker">Start</span>
                <span className="kicker">End</span>
                <span className="kicker">Break</span>
                <span className="kicker text-right">Paid</span>
                <span />
              </div>
              {state.templates.map((t, i) => {
                const hours = templateHours[i];
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[3rem_1fr_6rem_6rem_5rem_5rem_2rem] items-center gap-3 border-t border-[var(--rule)] px-5 py-2.5 sm:px-7"
                  >
                    <PlainInput
                      ariaLabel={`Shift code ${i + 1}`}
                      value={t.code}
                      onChange={(code) =>
                        setTemplate(i, { code: code.slice(0, 1).toUpperCase() })
                      }
                      className="h-9 text-center text-base"
                    />
                    <PlainInput
                      ariaLabel={`Shift name ${i + 1}`}
                      value={t.label}
                      onChange={(label) => setTemplate(i, { label })}
                      className="h-9 font-sans text-base"
                    />
                    <PlainInput
                      ariaLabel={`Shift start ${i + 1}`}
                      value={t.start}
                      onChange={(start) => setTemplate(i, { start })}
                      className={cn(
                        "h-9 text-base",
                        hours.minutes === null && "border-loss",
                      )}
                    />
                    <PlainInput
                      ariaLabel={`Shift end ${i + 1}`}
                      value={t.end}
                      onChange={(end) => setTemplate(i, { end })}
                      className={cn(
                        "h-9 text-base",
                        hours.minutes === null && "border-loss",
                      )}
                    />
                    <PlainInput
                      ariaLabel={`Shift break ${i + 1}`}
                      value={t.brk}
                      onChange={(brk) => setTemplate(i, { brk })}
                      className="h-9 text-base"
                    />
                    <div className="flex items-center justify-end gap-1 font-mono text-sm tabular-nums">
                      {hours.crossesMidnight && (
                        <Moon
                          className="size-3.5 text-muted-foreground"
                          aria-label="Crosses midnight"
                        />
                      )}
                      {hours.minutes === null ? (
                        <span className="text-loss">—</span>
                      ) : (
                        <span>{formatHours(hours.minutes)}</span>
                      )}
                    </div>
                    {state.templates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove shift ${t.label}`}
                        onClick={() => removeTemplate(i)}
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

      {/* ---- 03 the grid ---- */}
      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">03</span>
            The rota
          </h2>
          {state.staff.length < MAX_STAFF && (
            <Button variant="outline" size="sm" onClick={addStaff}>
              <Plus className="size-3.5" />
              Add a person
            </Button>
          )}
        </div>

        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="rule-b">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-card px-5 py-2 text-left sm:px-7"
                  >
                    <span className="kicker">Person</span>
                  </th>
                  {dates.map((d, i) => (
                    <th key={i} scope="col" className="px-1 py-2 text-center">
                      <span className="kicker block">{weekdayOf(d)}</span>
                      <span className="block font-mono text-[0.6875rem] text-muted-foreground">
                        {d.slice(5)}
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right">
                    <span className="kicker">Hours</span>
                  </th>
                  <th scope="col" className="px-3 py-2 text-right sm:pr-7">
                    <span className="kicker">Pay</span>
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {state.staff.map((person, pi) => {
                  const totals = result.employees[pi];
                  const over = totals.overtimeMinutes > 0;
                  return (
                    <tr key={pi} className="border-t border-[var(--rule)]">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-card px-5 py-2 text-left font-normal sm:px-7"
                      >
                        <div className="flex min-w-40 flex-col gap-1">
                          <PlainInput
                            ariaLabel={`Name ${pi + 1}`}
                            value={person.name}
                            onChange={(name) => setStaff(pi, { name })}
                            className="h-8 font-sans text-base"
                          />
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              $
                            </span>
                            <PlainInput
                              ariaLabel={`Rate ${pi + 1}`}
                              value={person.rate}
                              onChange={(rate) => setStaff(pi, { rate })}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      </th>

                      {Array.from({ length: state.dayCount }, (_, di) => {
                        const code = person.days[di] ?? OFF;
                        const worked = totals.dayMinutes[di];
                        return (
                          <td key={di} className="px-1 py-2 text-center">
                            {/* A native select: with up to 12 × 14 cells, a
                                rich dropdown per cell would be slower to use
                                and slower to render. */}
                            <select
                              aria-label={`${person.name || `Person ${pi + 1}`}, ${weekdayOf(dates[di])} ${dates[di]}`}
                              value={code}
                              onChange={(e) => setCell(pi, di, e.target.value)}
                              className={cn(
                                "w-14 rounded-sm border px-1 py-1.5 text-center font-mono text-sm transition-colors",
                                code === OFF
                                  ? "border-[var(--rule)] bg-transparent text-muted-foreground"
                                  : "border-foreground/20 bg-accent text-foreground",
                              )}
                            >
                              <option value={OFF}>—</option>
                              {state.templates.map((t) => (
                                <option key={t.code} value={t.code}>
                                  {t.code}
                                </option>
                              ))}
                            </select>
                            <span className="mt-0.5 block font-mono text-[0.625rem] text-muted-foreground">
                              {worked > 0 ? formatHours(worked) : ""}
                            </span>
                          </td>
                        );
                      })}

                      <td
                        className={cn(
                          "px-3 py-2 text-right font-mono tabular-nums",
                          over && "text-gain",
                        )}
                      >
                        {formatHours(totals.totalMinutes)}
                        {over && (
                          <span className="block text-[0.625rem]">
                            +{formatHours(totals.overtimeMinutes)} OT
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums sm:pr-7">
                        {formatCurrency(totals.pay, true)}
                      </td>
                      <td className="pr-2">
                        {state.staff.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${person.name}`}
                            onClick={() => removeStaff(pi)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="rule-t bg-accent/60">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-accent px-5 py-2.5 text-left sm:px-7"
                  >
                    <span className="kicker">Cover</span>
                  </th>
                  {result.days.map((d, i) => (
                    <td
                      key={i}
                      className="px-1 py-2.5 text-center font-mono text-xs tabular-nums"
                    >
                      <span className="block">{d.headcount}</span>
                      <span className="block text-[0.625rem] text-muted-foreground">
                        {d.minutes > 0 ? formatHours(d.minutes) : "—"}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-mono font-medium tabular-nums">
                    {formatHours(result.totalMinutes)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-medium tabular-nums sm:pr-7">
                    {formatCurrency(result.totalCost, true)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>
      </section>

      {/* ---- 04 summary ---- */}
      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-3 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <span className="kicker">How the week is counted</span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Overtime is worked out per seven days from the start date, not per
              rota. On a fortnight, a heavy week followed by a light one still
              earns overtime — set the start date to your workweek start and it
              matches the payslip.
            </p>
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              A shift ending at or before it starts crosses midnight and is
              marked with a moon. Nothing is stored anywhere — use the share
              link or the CSV to keep a rota.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-px bg-[var(--rule)] sm:grid-cols-4">
              {[
                { label: "Scheduled hours", value: formatHours(result.totalMinutes) },
                {
                  label: "Of which overtime",
                  value: formatHours(result.overtimeMinutes),
                },
                {
                  label: "Wage cost",
                  value: formatCurrency(result.totalCost, true),
                },
                { label: "People rostered", value: String(result.staffed) },
              ].map((s) => (
                <div key={s.label} className="bg-card px-5 py-5 sm:px-7">
                  <span className="kicker">{s.label}</span>
                  <div className="font-heading mt-1 text-2xl leading-none tracking-tight">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="rule-t">
              <table className="w-full text-sm">
                <tbody>
                  {result.employees.map((e, i) => (
                    <tr key={i} className="border-t border-[var(--rule)] first:border-t-0">
                      <th
                        scope="row"
                        className="py-2 pr-3 pl-5 text-left font-normal text-muted-foreground sm:pl-7"
                      >
                        {e.employee.name}
                        <span className="ml-2 font-mono text-xs">
                          {e.shiftsWorked} shifts · {e.daysOff} off
                        </span>
                      </th>
                      <td className="py-2 text-right font-mono tabular-nums">
                        {formatHours(e.totalMinutes)} h
                      </td>
                      <td
                        className={cn(
                          "w-24 py-2 pr-5 text-right font-mono text-[0.8125rem] tabular-nums sm:pr-7",
                          e.overtimeMinutes > 0
                            ? "text-gain"
                            : "text-muted-foreground",
                        )}
                      >
                        {e.overtimeMinutes > 0
                          ? `+${formatHours(e.overtimeMinutes)} OT`
                          : threshold > 0
                            ? "within"
                            : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" className="rounded-sm" onClick={downloadCsv}>
          <Download className="size-3.5" />
          Download CSV
        </Button>
        <CopyButton
          variant="outline"
          getValue={() => buildSummary(state, result, dates)}
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
  result: ReturnType<typeof computeSchedule>,
  dates: string[],
): string {
  const lines: string[] = [];
  lines.push(
    `Rota ${dates[0]} to ${dates[dates.length - 1]} · overtime after ${state.overtimeThreshold} h a week at ${state.overtimeMultiplier}x`,
  );
  lines.push("");
  state.templates.forEach((t) => {
    lines.push(`  ${t.code}  ${t.label} ${t.start}–${t.end}, ${t.brk} min break`);
  });
  lines.push("");
  result.employees.forEach((e) => {
    lines.push(
      `  ${e.employee.name.padEnd(12)} ${e.employee.days.join(" ")}  ${formatHours(e.totalMinutes).padStart(6)} h${e.overtimeMinutes > 0 ? ` (+${formatHours(e.overtimeMinutes)} OT)` : ""}  ${formatCurrency(e.pay, true)}`,
    );
  });
  lines.push("");
  lines.push(
    `  Cover        ${result.days.map((d) => d.headcount).join(" ")}`,
  );
  lines.push("");
  lines.push(`Scheduled hours: ${formatHours(result.totalMinutes)}`);
  lines.push(`Overtime:        ${formatHours(result.overtimeMinutes)}`);
  lines.push(`Wage cost:       ${formatCurrency(result.totalCost, true)} gross`);
  return lines.join("\n");
}
