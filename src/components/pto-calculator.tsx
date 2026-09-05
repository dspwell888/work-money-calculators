"use client";

import * as React from "react";
import { Link2 } from "lucide-react";

import {
  BreakdownTable,
  ChoiceSelect,
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency, parseNumber } from "@/lib/salary";
import {
  ACCRUAL_PERIOD_LABEL,
  ACCRUAL_PERIODS,
  BALANCE_UNITS,
  computeAccrual,
  computePayout,
  formatBalance,
  PERIODS_PER_YEAR,
  type AccrualPeriod,
  type BalanceUnit,
} from "@/lib/pto";

type Mode = "balance" | "payout";

interface State {
  mode: Mode;
  startDate: string;
  asOfDate: string;
  ratePerPeriod: string;
  period: AccrualPeriod;
  unit: BalanceUnit;
  hoursPerDay: string;
  used: string;
  carryover: string;
  cap: string;
  hourlyRate: string;
}

const INITIAL: State = {
  mode: "balance",
  startDate: "2026-01-01",
  asOfDate: "2026-07-01",
  ratePerPeriod: "4",
  period: "biweekly",
  unit: "hours",
  hoursPerDay: "8",
  used: "0",
  carryover: "0",
  cap: "0",
  hourlyRate: "25",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("mode", s.mode);
  q.set("start", s.startDate);
  q.set("asof", s.asOfDate);
  q.set("rate", s.ratePerPeriod);
  q.set("per", s.period);
  q.set("unit", s.unit);
  if (s.hoursPerDay !== INITIAL.hoursPerDay) q.set("hpd", s.hoursPerDay);
  if (parseNumber(s.used) !== 0) q.set("used", s.used);
  if (parseNumber(s.carryover) !== 0) q.set("carry", s.carryover);
  if (parseNumber(s.cap) !== 0) q.set("cap", s.cap);
  if (s.mode === "payout") q.set("hr", s.hourlyRate);
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("start")) return null;
  const per = q.get("per");
  const unit = q.get("unit");
  return {
    mode: q.get("mode") === "payout" ? "payout" : "balance",
    startDate: q.get("start") ?? INITIAL.startDate,
    asOfDate: q.get("asof") ?? INITIAL.asOfDate,
    ratePerPeriod: q.get("rate") ?? INITIAL.ratePerPeriod,
    period: (ACCRUAL_PERIODS as readonly string[]).includes(per ?? "")
      ? (per as AccrualPeriod)
      : INITIAL.period,
    unit: (BALANCE_UNITS as readonly string[]).includes(unit ?? "")
      ? (unit as BalanceUnit)
      : INITIAL.unit,
    hoursPerDay: q.get("hpd") ?? INITIAL.hoursPerDay,
    used: q.get("used") ?? "0",
    carryover: q.get("carry") ?? "0",
    cap: q.get("cap") ?? "0",
    hourlyRate: q.get("hr") ?? INITIAL.hourlyRate,
  };
}

export function PtoCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const unit = state.unit;
  const result = computeAccrual({
    startDate: state.startDate,
    asOfDate: state.asOfDate,
    ratePerPeriod: parseNumber(state.ratePerPeriod),
    period: state.period,
    unit,
    hoursPerDay: parseNumber(state.hoursPerDay),
    used: parseNumber(state.used),
    carryover: parseNumber(state.carryover),
    cap: parseNumber(state.cap),
  });

  const hourlyRate = parseNumber(state.hourlyRate);
  const payout = computePayout(result.balanceHours, hourlyRate);
  const isPayout = state.mode === "payout";
  const datesValid = result.daysBetween !== null;

  const rows = [
    {
      label: `Accrued over ${result.periodsElapsed} ${result.periodsElapsed === 1 ? "period" : "periods"}`,
      value: formatBalance(result.accruedRaw, unit),
    },
    ...(parseNumber(state.carryover) > 0
      ? [
          {
            label: "Carried over from last year",
            value: formatBalance(parseNumber(state.carryover), unit),
          },
        ]
      : []),
    ...(result.forfeited > 0
      ? [
          {
            label: "Lost to the cap",
            value: formatBalance(result.forfeited, unit),
            noteTone: "loss" as const,
          },
        ]
      : []),
    {
      label: "Time already taken",
      value: formatBalance(result.used, unit),
    },
    {
      label: "Balance",
      value: formatBalance(result.balance, unit),
      emphasis: true,
    },
    {
      label: "Balance in hours",
      value: `${Math.round(result.balanceHours * 100) / 100} h`,
    },
    {
      label: "Balance in days",
      value: `${Math.round(result.balanceDays * 100) / 100} days`,
    },
    {
      label: "Full-year accrual at this rate",
      value: formatBalance(result.accruedPerYear, unit),
    },
  ];

  if (isPayout) {
    rows.push({
      label: `Payout at ${formatCurrency(hourlyRate)} an hour`,
      value: formatCurrency(payout, true),
      emphasis: true,
    });
  }

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="Your accrual rule" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Accrual per period"
            htmlFor="rate"
            hint="What lands in your balance each time"
          >
            <PlainInput
              id="rate"
              value={state.ratePerPeriod}
              onChange={(ratePerPeriod) => patch({ ratePerPeriod })}
            />
          </Field>
          <Field label="Counted in" htmlFor="unit">
            <ChoiceSelect<BalanceUnit>
              id="unit"
              value={unit}
              onChange={(u) => patch({ unit: u })}
              options={[
                { value: "hours", label: "Hours" },
                { value: "days", label: "Days" },
              ]}
            />
          </Field>
          <Field
            label="How often it accrues"
            htmlFor="period"
            hint={`${PERIODS_PER_YEAR[state.period]} times a year`}
          >
            <ChoiceSelect<AccrualPeriod>
              id="period"
              value={state.period}
              onChange={(period) => patch({ period })}
              options={ACCRUAL_PERIODS.map((p) => ({
                value: p,
                label: ACCRUAL_PERIOD_LABEL[p],
              }))}
            />
          </Field>
          <Field
            label="Hours in a working day"
            htmlFor="hpd"
            hint="Used to convert between hours and days"
          >
            <PlainInput
              id="hpd"
              value={state.hoursPerDay}
              onChange={(hoursPerDay) => patch({ hoursPerDay })}
            />
          </Field>
        </div>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            Your balance
          </h2>
        </div>

        <Panel>
          <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
            <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
              <ModeTabs<Mode>
                value={state.mode}
                onChange={(mode) => patch({ mode })}
                options={[
                  { value: "balance", label: "Balance" },
                  { value: "payout", label: "Cash out" },
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Accrual starts" htmlFor="start">
                  <DateInput
                    id="start"
                    value={state.startDate}
                    onChange={(startDate) => patch({ startDate })}
                  />
                </Field>
                <Field label="Balance as of" htmlFor="asof">
                  <DateInput
                    id="asof"
                    value={state.asOfDate}
                    onChange={(asOfDate) => patch({ asOfDate })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label={`Used (${unit})`} htmlFor="used">
                  <PlainInput
                    id="used"
                    value={state.used}
                    onChange={(used) => patch({ used })}
                  />
                </Field>
                <Field label={`Carried over`} htmlFor="carry">
                  <PlainInput
                    id="carry"
                    value={state.carryover}
                    onChange={(carryover) => patch({ carryover })}
                  />
                </Field>
              </div>

              <Field
                label="Annual cap"
                htmlFor="cap"
                hint="Most you can hold at once. 0 for no cap"
              >
                <PlainInput
                  id="cap"
                  value={state.cap}
                  onChange={(cap) => patch({ cap })}
                />
              </Field>

              {isPayout && (
                <Field
                  label="Hourly rate"
                  htmlFor="hourly"
                  hint="Used to cash out the balance"
                >
                  <MoneyInput
                    id="hourly"
                    value={state.hourlyRate}
                    onChange={(hourlyRate) => patch({ hourlyRate })}
                  />
                </Field>
              )}

              <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
                Only completed periods count. A fortnightly accrual credits on
                day 14, not part way through — which is why a balance can look
                lower here than a rough estimate suggests.
              </p>
            </div>

            <div className="flex flex-col">
              {datesValid ? (
                <Headline
                  kicker={isPayout ? "Payout value" : "Balance"}
                  value={
                    isPayout
                      ? formatCurrency(payout, true)
                      : formatBalance(result.balance, unit)
                  }
                  unit={
                    isPayout
                      ? `for ${Math.round(result.balanceHours * 100) / 100} hours, gross`
                      : `as of ${state.asOfDate}`
                  }
                  delta={
                    <>
                      {result.periodsElapsed} completed{" "}
                      {result.periodsElapsed === 1 ? "period" : "periods"}
                      <span className="mx-2 text-muted-foreground">·</span>
                      {result.daysBetween} days
                      {result.forfeited > 0 && (
                        <>
                          <span className="mx-2 text-muted-foreground">·</span>
                          {formatBalance(result.forfeited, unit)} lost to the cap
                        </>
                      )}
                    </>
                  }
                  deltaTone={result.forfeited > 0 ? "loss" : deltaTone(0)}
                />
              ) : (
                <div className="px-5 py-6 sm:px-7">
                  <span className="kicker">Balance</span>
                  <p className="mt-2 text-sm text-loss">
                    Enter both dates as yyyy-mm-dd to see a balance.
                  </p>
                </div>
              )}
              <BreakdownTable
                caption="How it adds up"
                captionNote={`${ACCRUAL_PERIOD_LABEL[state.period].toLowerCase()}`}
                rows={rows}
              />
            </div>
          </div>
        </Panel>
      </section>

      <div className="flex flex-wrap gap-3">
        <CopyButton
          getValue={() => buildSummary(state, result, payout, isPayout)}
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

function DateInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-11 rounded-sm border-0 border-b border-input bg-transparent px-0 font-mono text-base tabular-nums shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent",
      )}
    />
  );
}

function buildSummary(
  state: State,
  result: ReturnType<typeof computeAccrual>,
  payout: number,
  isPayout: boolean,
): string {
  const unit = state.unit;
  const lines: string[] = [];
  lines.push(
    `Accrual: ${state.ratePerPeriod} ${unit} ${ACCRUAL_PERIOD_LABEL[state.period].toLowerCase()}`,
  );
  lines.push(`From ${state.startDate} to ${state.asOfDate}`);
  lines.push("");
  lines.push(
    `  Completed periods: ${result.periodsElapsed} (${result.daysBetween ?? 0} days)`,
  );
  lines.push(`  Accrued:           ${formatBalance(result.accruedRaw, unit)}`);
  if (parseNumber(state.carryover) > 0) {
    lines.push(
      `  Carried over:      ${formatBalance(parseNumber(state.carryover), unit)}`,
    );
  }
  if (result.forfeited > 0) {
    lines.push(`  Lost to cap:       ${formatBalance(result.forfeited, unit)}`);
  }
  lines.push(`  Used:              ${formatBalance(result.used, unit)}`);
  lines.push("");
  lines.push(
    `Balance: ${formatBalance(result.balance, unit)} = ${Math.round(result.balanceHours * 100) / 100} hours = ${Math.round(result.balanceDays * 100) / 100} days`,
  );
  if (isPayout) {
    lines.push(
      `Payout at ${formatCurrency(parseNumber(state.hourlyRate))}/h: ${formatCurrency(payout, true)} gross`,
    );
  }
  return lines.join("\n");
}
