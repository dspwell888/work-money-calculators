"use client";

import * as React from "react";
import { Check, Copy, Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  applyEstimatedRate,
  computeRaise,
  computeRealRaise,
  DEFAULT_INFLATION_PERCENT,
  DEFAULT_SCHEDULE,
  explainRaise,
  formatCurrency,
  formatMoneyDisplay,
  formatPercent,
  formatSigned,
  PAY_PERIOD_LABEL,
  PAY_PERIOD_SUFFIX,
  PAY_PERIODS,
  parseNumber,
  realRaiseVerdict,
  toAnnual,
  type PayPeriod,
  type RaiseMode,
  type RaiseMathLine,
  type Scenario,
  type WorkSchedule,
} from "@/lib/salary";

const MAX_SCENARIOS = 3;

const MODE_LABEL: Record<RaiseMode, string> = {
  percent: "Raise %",
  amount: "Flat increase",
  target: "Target pay",
};

const MODE_HINT: Record<RaiseMode, string> = {
  // No directional wording: the results sit to the right on desktop and
  // below on mobile.
  percent:
    "Use this when your employer named a percentage. Every figure updates as you type.",
  amount:
    "Use this when the offer was money, not a percentage. Pick the period it was quoted in — an extra $2 an hour and an extra $4,000 a year are very different raises.",
  target:
    "Use this when preparing to ask for a number. The calculator works backwards to the raise it would take.",
};

/** Common asks, so the usual case is one tap rather than typing. */
const QUICK_PERCENTS = [2, 3, 4, 5, 7, 10];

const SCENARIO_NAMES = ["Scenario A", "Scenario B", "Scenario C"];

function newScenario(index: number, percent: number): Scenario {
  return {
    id: `s${index}`,
    label: SCENARIO_NAMES[index] ?? `Scenario ${index + 1}`,
    mode: "percent",
    percent,
    amount: 0,
    amountPeriod: "annual",
    target: 0,
    targetPeriod: "annual",
  };
}

interface FormState {
  pay: string;
  period: PayPeriod;
  hoursPerWeek: string;
  weeksPerYear: string;
  taxRate: string;
  inflation: string;
  scenarios: Scenario[];
}

const INITIAL: FormState = {
  pay: "60000",
  period: "annual",
  hoursPerWeek: String(DEFAULT_SCHEDULE.hoursPerWeek),
  weeksPerYear: String(DEFAULT_SCHEDULE.weeksPerYear),
  taxRate: "",
  inflation: String(DEFAULT_INFLATION_PERCENT),
  scenarios: [newScenario(0, 5)],
};

/* ------------------------------------------------------------------ */
/* URL state                                                           */
/* ------------------------------------------------------------------ */

function isPayPeriod(v: string | null): v is PayPeriod {
  return !!v && (PAY_PERIODS as readonly string[]).includes(v);
}

function isMode(v: string | null): v is RaiseMode {
  return v === "percent" || v === "amount" || v === "target";
}

function encodeState(s: FormState): string {
  const q = new URLSearchParams();
  q.set("pay", s.pay);
  q.set("period", s.period);
  if (s.hoursPerWeek !== INITIAL.hoursPerWeek) q.set("hpw", s.hoursPerWeek);
  if (s.weeksPerYear !== INITIAL.weeksPerYear) q.set("wpy", s.weeksPerYear);
  if (s.taxRate) q.set("tax", s.taxRate);
  if (s.inflation !== INITIAL.inflation) q.set("infl", s.inflation);
  s.scenarios.forEach((sc, i) => {
    q.set(`m${i}`, sc.mode);
    if (sc.mode === "percent") q.set(`v${i}`, String(sc.percent));
    if (sc.mode === "amount") {
      q.set(`v${i}`, String(sc.amount));
      q.set(`u${i}`, sc.amountPeriod);
    }
    if (sc.mode === "target") {
      q.set(`v${i}`, String(sc.target));
      q.set(`u${i}`, sc.targetPeriod);
    }
    if (sc.label !== SCENARIO_NAMES[i]) q.set(`n${i}`, sc.label);
  });
  return q.toString();
}

function decodeState(search: string): FormState | null {
  const q = new URLSearchParams(search);
  if (!q.has("pay")) return null;

  const scenarios: Scenario[] = [];
  for (let i = 0; i < MAX_SCENARIOS; i++) {
    const mode = q.get(`m${i}`);
    if (!isMode(mode)) continue;
    const value = parseNumber(q.get(`v${i}`) ?? "0");
    const unitRaw = q.get(`u${i}`);
    const unit: PayPeriod = isPayPeriod(unitRaw) ? unitRaw : "annual";
    const base = newScenario(i, 0);
    scenarios.push({
      ...base,
      label: q.get(`n${i}`) ?? base.label,
      mode,
      percent: mode === "percent" ? value : base.percent,
      amount: mode === "amount" ? value : base.amount,
      amountPeriod: unit,
      target: mode === "target" ? value : base.target,
      targetPeriod: unit,
    });
  }

  const periodRaw = q.get("period");
  return {
    pay: q.get("pay") ?? INITIAL.pay,
    period: isPayPeriod(periodRaw) ? periodRaw : INITIAL.period,
    hoursPerWeek: q.get("hpw") ?? INITIAL.hoursPerWeek,
    weeksPerYear: q.get("wpy") ?? INITIAL.weeksPerYear,
    taxRate: q.get("tax") ?? "",
    inflation: q.get("infl") ?? INITIAL.inflation,
    scenarios: scenarios.length ? scenarios : INITIAL.scenarios,
  };
}

/* ------------------------------------------------------------------ */

export function RaiseCalculator() {
  const [state, setState] = React.useState<FormState>(INITIAL);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // Restoring from the URL has to happen after mount: the static HTML is
    // built once for every visitor, so reading window.location during render
    // would make the first client render disagree with it. The alternative
    // (useSearchParams + Suspense) would keep the calculator out of the static
    // HTML entirely and flash a fallback, which costs more than one frame.
    /* eslint-disable react-hooks/set-state-in-effect */
    const encoded = window.location.hash.slice(1) || window.location.search;
    const fromUrl = decodeState(encoded);
    if (fromUrl) setState(fromUrl);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Keep the address bar shareable without spamming browser history.
  React.useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      const url = `${window.location.pathname}#${encodeState(state)}`;
      window.history.replaceState(null, "", url);
    }, 400);
    return () => window.clearTimeout(id);
  }, [state, hydrated]);

  const schedule: WorkSchedule = {
    hoursPerWeek:
      parseNumber(state.hoursPerWeek) || DEFAULT_SCHEDULE.hoursPerWeek,
    weeksPerYear:
      parseNumber(state.weeksPerYear) || DEFAULT_SCHEDULE.weeksPerYear,
  };

  const currentAnnual = toAnnual(parseNumber(state.pay), state.period, schedule);
  const results = state.scenarios.map((sc) =>
    computeRaise(currentAnnual, sc, schedule),
  );

  const taxRate = state.taxRate ? parseNumber(state.taxRate) : null;
  const showTakeHome = taxRate !== null && taxRate > 0 && taxRate < 100;
  const single = state.scenarios.length === 1;

  // The real-terms view always follows the first scenario: with two or three
  // on screen the comparison table is already the answer, and a second set of
  // inflation figures per column would bury it.
  const inflationPercent = parseNumber(state.inflation);
  const real = computeRealRaise(
    currentAnnual,
    results[0]?.newAnnual ?? currentAnnual,
    inflationPercent,
  );

  const patch = (next: Partial<FormState>) =>
    setState((prev) => ({ ...prev, ...next }));

  const patchScenario = (index: number, next: Partial<Scenario>) =>
    setState((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((sc, i) =>
        i === index ? { ...sc, ...next } : sc,
      ),
    }));

  const addScenario = () =>
    setState((prev) => {
      if (prev.scenarios.length >= MAX_SCENARIOS) return prev;
      const i = prev.scenarios.length;
      const previous = prev.scenarios[i - 1];
      // Seed the next scenario a couple of points above the last one so the
      // comparison is meaningful the moment it appears.
      const seed =
        previous?.mode === "percent" ? previous.percent + 2 : 5 + i * 2;
      return { ...prev, scenarios: [...prev.scenarios, newScenario(i, seed)] };
    });

  const removeScenario = (index: number) =>
    setState((prev) => ({
      ...prev,
      scenarios: prev.scenarios.filter((_, i) => i !== index),
    }));

  const summary = buildSummary(state, schedule, currentAnnual, taxRate);

  return (
    <div className="flex flex-col gap-12">
      {/* ---- current pay worksheet ---- */}
      <Panel>
        <PanelHead index="01" title="Your current pay" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field label="Current pay" htmlFor="current-pay">
            <MoneyInput
              id="current-pay"
              value={state.pay}
              onChange={(pay) => patch({ pay })}
            />
          </Field>
          <Field label="Pay period" htmlFor="current-period">
            <PeriodSelect
              id="current-period"
              value={state.period}
              onChange={(period) => patch({ period })}
            />
          </Field>
          <Field
            label="Hours per week"
            htmlFor="hours-per-week"
            hint="Used for hourly conversions"
          >
            <PlainInput
              id="hours-per-week"
              value={state.hoursPerWeek}
              onChange={(v) => patch({ hoursPerWeek: v })}
            />
          </Field>
          <Field
            label="Weeks per year"
            htmlFor="weeks-per-year"
            hint="Drop below 52 for unpaid weeks"
          >
            <PlainInput
              id="weeks-per-year"
              value={state.weeksPerYear}
              onChange={(v) => patch({ weeksPerYear: v })}
            />
          </Field>
        </div>
        <div className="rule-t flex items-baseline justify-between px-5 py-3.5 sm:px-7">
          <span className="kicker">Annual basis</span>
          <span className="font-mono text-sm tabular-nums">
            {formatCurrency(currentAnnual, true)}
          </span>
        </div>
      </Panel>

      {/* ---- scenarios ---- */}
      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            {single ? "Your raise" : "Raise scenarios"}
          </h2>
          {state.scenarios.length < MAX_SCENARIOS && (
            <Button variant="outline" size="sm" onClick={addScenario}>
              <Plus className="size-3.5" />
              Compare another
            </Button>
          )}
        </div>

        {single ? (
          <SingleScenario
            scenario={state.scenarios[0]}
            result={results[0]}
            period={state.period}
            schedule={schedule}
            taxRate={showTakeHome ? taxRate : null}
            inflationPercent={inflationPercent}
            onChange={(next) => patchScenario(0, next)}
          />
        ) : (
          <div
            className={cn(
              "grid gap-5",
              state.scenarios.length === 2 && "md:grid-cols-2",
              state.scenarios.length >= 3 && "md:grid-cols-3",
            )}
          >
            {state.scenarios.map((sc, i) => (
              <ScenarioCard
                key={sc.id}
                scenario={sc}
                result={results[i]}
                period={state.period}
                schedule={schedule}
                taxRate={showTakeHome ? taxRate : null}
                inflationPercent={inflationPercent}
                onChange={(next) => patchScenario(i, next)}
                onRemove={() => removeScenario(i)}
              />
            ))}
          </div>
        )}
      </section>

      {!single && (
        <ComparisonTable
          scenarios={state.scenarios}
          results={results}
          period={state.period}
          taxRate={showTakeHome ? taxRate : null}
        />
      )}

      {/* ---- real terms ---- */}
      <Panel>
        <PanelHead
          index="03"
          title="After inflation"
          note={single ? undefined : state.scenarios[0].label}
        />
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <Field
              label="Inflation over the same period"
              htmlFor="inflation"
              hint="Your figure — see the note below"
            >
              <div className="relative">
                <Input
                  id="inflation"
                  inputMode="decimal"
                  className={cn(INPUT_CLASS, "pr-8")}
                  value={state.inflation}
                  onChange={(e) => patch({ inflation: e.target.value })}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  %
                </span>
              </div>
            </Field>

            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">
                The 3% shown is a placeholder, not a published figure.
              </strong>{" "}
              Nothing is fetched and no rate is assumed: inflation differs by
              country, gets revised after publication, and any number built in
              here would be wrong for most people and stale within a year. Put
              in the rate for your own country and period, from your national
              statistics office.
            </p>

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              The exact figure is used —{" "}
              <span className="font-mono">(1 + raise) ÷ (1 + inflation)</span> —
              rather than subtracting one from the other. The subtraction is
              shown too, since it is what people say out loud.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="px-5 py-6 sm:px-7">
              <span className="kicker">Real raise</span>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span
                  className={cn(
                    "font-heading text-[clamp(2.75rem,7vw,4rem)] leading-[0.9] tracking-tight",
                    deltaClass(real.purchasingPowerChange),
                  )}
                >
                  {formatPercent(real.realPercent)}
                </span>
                <span className="text-sm text-muted-foreground">
                  after inflation
                </span>
              </div>
              <p
                className={cn(
                  "mt-3 max-w-prose text-sm leading-relaxed",
                  deltaClass(real.purchasingPowerChange),
                )}
              >
                {realRaiseVerdict(real)}
              </p>
            </div>

            <div className="rule-t mt-auto">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    {
                      label: "Nominal raise",
                      value: formatPercent(real.nominalPercent),
                      note: formatSigned(results[0]?.increaseAnnual ?? 0),
                      tone: deltaClass(results[0]?.increaseAnnual ?? 0),
                    },
                    {
                      label: `Inflation over the period`,
                      value: `${Number(inflationPercent.toFixed(2))}%`,
                      note: "your figure",
                      tone: "text-muted-foreground",
                    },
                    {
                      label: "New salary in today's money",
                      value: formatCurrency(real.realNewAnnual, true),
                      note: "",
                      tone: "text-muted-foreground",
                      emphasis: true,
                    },
                    {
                      label: "Change in buying power",
                      value: formatSigned(real.purchasingPowerChange),
                      note: formatPercent(real.realPercent),
                      tone: deltaClass(real.purchasingPowerChange),
                      emphasis: true,
                    },
                    {
                      label: "Salary needed just to keep pace",
                      value: formatCurrency(real.breakEvenAnnual, true),
                      note: formatSigned(real.breakEvenGap),
                      tone: deltaClass(real.breakEvenGap),
                    },
                    {
                      label: "Rule of thumb (raise − inflation)",
                      value: formatPercent(real.approxPercent),
                      note: "approximate",
                      tone: "text-muted-foreground",
                    },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      className={cn(
                        "border-t border-[var(--rule)]",
                        row.emphasis && "bg-accent/60",
                      )}
                    >
                      <th
                        scope="row"
                        className="py-2 pr-3 pl-5 text-left font-normal text-muted-foreground sm:pl-7"
                      >
                        {row.label}
                      </th>
                      <td
                        className={cn(
                          "py-2 text-right font-mono tabular-nums",
                          row.emphasis && "font-medium",
                        )}
                      >
                        {row.value}
                      </td>
                      <td
                        className={cn(
                          "w-28 py-2 pr-5 pl-3 text-right font-mono text-[0.8125rem] tabular-nums sm:pr-7",
                          row.tone,
                        )}
                      >
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Panel>

      {/* ---- optional take-home ---- */}
      <Panel>
        <PanelHead index="04" title="Estimated take-home" note="Optional" />
        <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-start sm:gap-10 sm:px-7">
          <div className="w-full shrink-0 sm:w-52">
            <Field
              label="Your deduction rate"
              htmlFor="tax-rate"
              hint="Leave blank to skip"
            >
              <div className="relative">
                <PlainInput
                  id="tax-rate"
                  placeholder="25"
                  className="pr-8"
                  value={state.taxRate}
                  onChange={(taxRate) => patch({ taxRate })}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </Field>
          </div>
          <p className="max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">
              Scenario estimate only.
            </strong>{" "}
            This applies whatever single percentage you type. It is not a tax
            calculation: it uses no tax tables, no withholding rules, and no
            rates for any country or state. Read the rate that actually applies
            to you off your own payslip.
          </p>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton
          getValue={() => summary}
          idleLabel="Copy summary"
          doneLabel="Summary copied"
          icon={<Copy className="size-3.5" />}
        />
        <CopyButton
          getValue={() =>
            `${window.location.origin}${window.location.pathname}#${encodeState(state)}`
          }
          idleLabel="Copy share link"
          doneLabel="Link copied"
          icon={<Link2 className="size-3.5" />}
          variant="outline"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Single scenario: inputs on the left, the payslip on the right       */
/* ------------------------------------------------------------------ */

function SingleScenario({
  scenario,
  result,
  period,
  schedule,
  taxRate,
  inflationPercent,
  onChange,
}: {
  scenario: Scenario;
  result: ReturnType<typeof computeRaise>;
  period: PayPeriod;
  schedule: WorkSchedule;
  taxRate: number | null;
  inflationPercent: number;
  onChange: (next: Partial<Scenario>) => void;
}) {
  return (
    <Panel className="rise">
      <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
          <ModeTabs value={scenario.mode} onChange={onChange} />
          <ModeFields scenario={scenario} onChange={onChange} />
          {scenario.mode === "percent" && (
            <QuickPercents
              value={scenario.percent}
              onPick={(percent) => onChange({ percent })}
            />
          )}
          <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
            {MODE_HINT[scenario.mode]}
          </p>
        </div>

        <div className="flex flex-col">
          <div className="px-5 py-6 sm:px-7">
            <span className="kicker">New pay</span>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="font-heading text-[clamp(2.75rem,7vw,4rem)] leading-[0.9] tracking-tight">
                {formatMoneyDisplay(result.next[period])}
              </span>
              <span className="text-sm text-muted-foreground">
                {PAY_PERIOD_SUFFIX[period]}
              </span>
            </div>
            <p
              className={cn(
                "mt-3 font-mono text-sm tabular-nums",
                deltaClass(result.increaseAnnual),
              )}
            >
              {formatPercent(result.percent)}
              <span className="mx-2 text-muted-foreground">·</span>
              {formatSigned(result.increaseAnnual)} a year
            </p>
          </div>

          <PeriodBreakdown
            result={result}
            period={period}
            schedule={schedule}
            taxRate={taxRate}
          />
          <ShowTheMath
            lines={explainRaise({
              currentAnnual: result.currentAnnual,
              scenario,
              result,
              schedule,
              period,
              inflationPercent,
            })}
          />
        </div>
      </div>
    </Panel>
  );
}

/**
 * The differentiator, on the first screen: one raise, every pay period at
 * once. Competing pages make you re-enter the figure to see this.
 */
function PeriodBreakdown({
  result,
  period,
  schedule,
  taxRate,
}: {
  result: ReturnType<typeof computeRaise>;
  period: PayPeriod;
  schedule: WorkSchedule;
  taxRate: number | null;
}) {
  return (
    <div className="rule-t mt-auto">
      <div className="flex items-baseline justify-between px-5 pt-4 pb-2 sm:px-7">
        <span className="kicker">The same raise, every period</span>
        <span className="kicker hidden sm:block">
          {schedule.hoursPerWeek} h/wk · {schedule.weeksPerYear} wk/yr
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {PAY_PERIODS.map((p) => (
            <tr
              key={p}
              className={cn(
                "border-t border-[var(--rule)]",
                p === period && "bg-accent/60",
              )}
            >
              <th
                scope="row"
                className="py-2 pr-3 pl-5 text-left font-normal text-muted-foreground sm:pl-7"
              >
                {PAY_PERIOD_LABEL[p]}
              </th>
              <td
                className={cn(
                  "py-2 text-right font-mono tabular-nums",
                  p === period && "font-medium",
                )}
              >
                {formatCurrency(result.next[p])}
              </td>
              <td
                className={cn(
                  "w-28 py-2 pr-5 pl-3 text-right font-mono text-[0.8125rem] tabular-nums sm:pr-7",
                  deltaClass(result.increase[p]),
                )}
              >
                {formatSigned(result.increase[p])}
              </td>
            </tr>
          ))}
          {taxRate !== null && (
            <tr className="border-t border-[var(--rule)]">
              <th
                scope="row"
                className="py-2 pr-3 pl-5 text-left font-normal text-muted-foreground sm:pl-7"
              >
                Est. take-home per year
                <span className="ml-1 text-xs">(at {taxRate}%)</span>
              </th>
              <td className="py-2 text-right font-mono tabular-nums">
                {formatCurrency(applyEstimatedRate(result.newAnnual, taxRate))}
              </td>
              <td className="py-2 pr-5 sm:pr-7" />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ShowTheMath({ lines }: { lines: RaiseMathLine[] }) {
  return (
    <div className="rule-t px-5 py-5 sm:px-7">
      <span className="kicker">Show the math</span>
      <div className="mt-3 flex flex-col gap-3">
        {lines.map((line) => (
          <p
            key={`${line.expression}=${line.result}`}
            className="font-mono text-sm leading-relaxed"
          >
            <span className="text-muted-foreground">{line.expression} =</span>{" "}
            <span className="font-medium">{line.result}</span>
            {line.unit ? (
              <>
                {" "}
                <span className="text-muted-foreground">{line.unit}</span>
              </>
            ) : null}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Multi-scenario                                                      */
/* ------------------------------------------------------------------ */

function ScenarioCard({
  scenario,
  result,
  period,
  schedule,
  taxRate,
  inflationPercent,
  onChange,
  onRemove,
}: {
  scenario: Scenario;
  result: ReturnType<typeof computeRaise>;
  period: PayPeriod;
  schedule: WorkSchedule;
  taxRate: number | null;
  inflationPercent: number;
  onChange: (next: Partial<Scenario>) => void;
  onRemove: () => void;
}) {
  return (
    <Panel className="rise flex flex-col">
      <div className="rule-b flex items-center gap-1 py-2 pr-2 pl-3 sm:pl-4">
        <Input
          aria-label="Scenario name"
          value={scenario.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="h-7 rounded-sm border-transparent bg-transparent px-1 font-medium hover:border-input focus-visible:border-ring"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${scenario.label}`}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 sm:px-5">
        <ModeTabs value={scenario.mode} onChange={onChange} compact />
        <ModeFields scenario={scenario} onChange={onChange} stacked />
      </div>

      <div className="rule-t mt-auto px-4 py-5 sm:px-5">
        <span className="kicker">New pay · {PAY_PERIOD_SUFFIX[period]}</span>
        <div className="font-heading mt-1 text-3xl leading-none tracking-tight">
          {formatMoneyDisplay(result.next[period])}
        </div>
        <p
          className={cn(
            "mt-2 font-mono text-[0.8125rem] tabular-nums",
            deltaClass(result.increaseAnnual),
          )}
        >
          {formatPercent(result.percent)}
          <span className="mx-1.5 text-muted-foreground">·</span>
          {formatSigned(result.increaseAnnual)}/yr
        </p>
        {taxRate !== null && (
          <p className="mt-2 text-xs text-muted-foreground">
            Est. take-home{" "}
            <span className="font-mono tabular-nums">
              {formatCurrency(applyEstimatedRate(result.newAnnual, taxRate), true)}
            </span>
          </p>
        )}
      </div>
      <ShowTheMath
        lines={explainRaise({
          currentAnnual: result.currentAnnual,
          scenario,
          result,
          schedule,
          period,
          inflationPercent,
        })}
      />
    </Panel>
  );
}

function ComparisonTable({
  scenarios,
  results,
  period,
  taxRate,
}: {
  scenarios: Scenario[];
  results: ReturnType<typeof computeRaise>[];
  period: PayPeriod;
  taxRate: number | null;
}) {
  // Rows are built conditionally so the table never repeats a figure: with an
  // annual pay period "new pay" and "new annual pay" are the same number, and
  // with an hourly one the hourly row is already the headline.
  const rows: { label: string; values: string[]; delta?: boolean }[] = [];

  if (period !== "annual") {
    rows.push({
      label: `New pay (${PAY_PERIOD_SUFFIX[period]})`,
      values: results.map((r) => formatCurrency(r.next[period])),
    });
  }
  rows.push(
    {
      label: "New annual pay",
      values: results.map((r) => formatCurrency(r.newAnnual, true)),
    },
    {
      label: "Raise percentage",
      values: results.map((r) => formatPercent(r.percent)),
      delta: true,
    },
  );
  if (period !== "annual") {
    rows.push({
      label: `Increase ${PAY_PERIOD_SUFFIX[period]}`,
      values: results.map((r) => formatSigned(r.increase[period])),
      delta: true,
    });
  }
  rows.push({
    label: "Increase per year",
    values: results.map((r) => formatSigned(r.increaseAnnual)),
    delta: true,
  });
  if (period !== "hourly") {
    rows.push({
      label: "New hourly rate",
      values: results.map((r) => formatCurrency(r.next.hourly)),
    });
  }
  if (taxRate !== null) {
    rows.push({
      label: `Est. take-home per year (at ${taxRate}%)`,
      values: results.map((r) =>
        formatCurrency(applyEstimatedRate(r.newAnnual, taxRate), true),
      ),
    });
  }

  // Highlight the strongest outcome so a three-way comparison reads at a glance.
  const best = results.reduce(
    (bestIdx, r, i) => (r.newAnnual > results[bestIdx].newAnnual ? i : bestIdx),
    0,
  );

  return (
    <Panel>
      <PanelHead index="—" title="Side by side" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-lg border-collapse text-sm">
          <thead>
            <tr className="rule-b">
              <th scope="col" className="py-3 pr-4 pl-5 text-left sm:pl-7">
                <span className="sr-only">Metric</span>
              </th>
              {scenarios.map((sc, i) => (
                <th
                  key={sc.id}
                  scope="col"
                  className="py-3 pr-5 pl-4 text-right font-medium last:pr-5 sm:last:pr-7"
                >
                  {sc.label}
                  {i === best && (
                    <span className="kicker ml-2 text-gain">Highest</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-[var(--rule)]">
                <th
                  scope="row"
                  className="py-2.5 pr-4 pl-5 text-left font-normal text-muted-foreground sm:pl-7"
                >
                  {row.label}
                </th>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={cn(
                      "py-2.5 pr-5 pl-4 text-right font-mono tabular-nums sm:last:pr-7",
                      row.delta && deltaClass(results[i].increaseAnnual),
                      i === best && "font-medium",
                    )}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function ModeTabs({
  value,
  onChange,
  compact = false,
}: {
  value: RaiseMode;
  onChange: (next: Partial<Scenario>) => void;
  compact?: boolean;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange({ mode: v as RaiseMode })}
    >
      <TabsList variant="line" className="h-auto w-full gap-4 p-0">
        {(Object.keys(MODE_LABEL) as RaiseMode[]).map((mode) => (
          <TabsTrigger
            key={mode}
            value={mode}
            className={cn(
              "h-auto flex-none rounded-none px-0 pb-1.5 font-normal",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {MODE_LABEL[mode]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function ModeFields({
  scenario,
  onChange,
  stacked = false,
}: {
  scenario: Scenario;
  onChange: (next: Partial<Scenario>) => void;
  stacked?: boolean;
}) {
  const valueId = `${scenario.id}-value`;
  const pairClass = stacked ? "flex flex-col gap-4" : "flex flex-col gap-5";

  if (scenario.mode === "percent") {
    return (
      <Field label="Raise percentage" htmlFor={valueId}>
        <div className="relative">
          <PlainInput
            id={valueId}
            className="pr-8"
            value={String(scenario.percent)}
            onChange={(v) => onChange({ percent: parseNumber(v) })}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            %
          </span>
        </div>
      </Field>
    );
  }

  if (scenario.mode === "amount") {
    return (
      <div className={pairClass}>
        <Field label="Pay increase" htmlFor={valueId}>
          <MoneyInput
            id={valueId}
            value={String(scenario.amount)}
            onChange={(v) => onChange({ amount: parseNumber(v) })}
          />
        </Field>
        <Field label="Increase is" htmlFor={`${valueId}-period`}>
          <PeriodSelect
            id={`${valueId}-period`}
            value={scenario.amountPeriod}
            onChange={(amountPeriod) => onChange({ amountPeriod })}
          />
        </Field>
      </div>
    );
  }

  return (
    <div className={pairClass}>
      <Field label="Target pay" htmlFor={valueId}>
        <MoneyInput
          id={valueId}
          value={String(scenario.target)}
          onChange={(v) => onChange({ target: parseNumber(v) })}
        />
      </Field>
      <Field label="Target is" htmlFor={`${valueId}-period`}>
        <PeriodSelect
          id={`${valueId}-period`}
          value={scenario.targetPeriod}
          onChange={(targetPeriod) => onChange({ targetPeriod })}
        />
      </Field>
    </div>
  );
}

function QuickPercents({
  value,
  onPick,
}: {
  value: number;
  onPick: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="kicker">Common raises</span>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PERCENTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            aria-pressed={value === p}
            className={cn(
              "rounded-sm border px-2 py-1 font-mono text-xs tabular-nums transition-colors",
              value === p
                ? "border-foreground bg-foreground text-background"
                : "border-[var(--rule)] text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-[var(--rule)] bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PanelHead({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="rule-b flex items-baseline justify-between gap-4 px-5 py-3 sm:px-7">
      <h2 className="font-heading text-lg leading-none">
        <span className="kicker mr-3 align-middle">{index}</span>
        {title}
      </h2>
      {note && <span className="kicker">{note}</span>}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="kicker">
        {label}
      </Label>
      {children}
      {hint && (
        <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

const INPUT_CLASS =
  "h-11 rounded-sm border-0 border-b border-input bg-transparent px-0 font-mono text-lg tabular-nums shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent";

function PlainInput({
  id,
  value,
  onChange,
  className,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      inputMode="decimal"
      placeholder={placeholder}
      className={cn(INPUT_CLASS, className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function MoneyInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center font-mono text-lg text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        inputMode="decimal"
        className={cn(INPUT_CLASS, "pl-5")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PeriodSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: PayPeriod;
  onChange: (p: PayPeriod) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PayPeriod)}>
      <SelectTrigger
        id={id}
        className="h-11 w-full rounded-sm border-0 border-b border-input px-0 text-base shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-sm">
        {PAY_PERIODS.map((p) => (
          <SelectItem key={p} value={p} className="rounded-sm">
            {PAY_PERIOD_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CopyButton({
  getValue,
  idleLabel,
  doneLabel,
  icon,
  variant = "default",
}: {
  getValue: () => string;
  idleLabel: string;
  doneLabel: string;
  icon: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const copy = async () => {
    const text = getValue();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // The async Clipboard API is blocked on insecure origins and by some
      // permission policies. Fall back to a selection-based copy.
      ok = legacyCopy(text);
    }
    setState(ok ? "copied" : "failed");
    window.setTimeout(() => setState("idle"), 2500);
  };

  return (
    <Button variant={variant} size="lg" className="rounded-sm" onClick={copy}>
      {state === "copied" ? <Check className="size-3.5" /> : icon}
      {state === "copied"
        ? doneLabel
        : state === "failed"
          ? "Press Ctrl/Cmd+C"
          : idleLabel}
    </Button>
  );
}

/** Last-resort copy for browsers that refuse navigator.clipboard. */
function legacyCopy(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

/** Green is a raise, oxblood is a cut, neutral is no change. */
function deltaClass(value: number): string {
  if (value > 0) return "text-gain";
  if (value < 0) return "text-loss";
  return "text-muted-foreground";
}

/* ------------------------------------------------------------------ */

function buildSummary(
  state: FormState,
  schedule: WorkSchedule,
  currentAnnual: number,
  taxRate: number | null,
): string {
  const real = computeRealRaise(
    currentAnnual,
    computeRaise(currentAnnual, state.scenarios[0], schedule).newAnnual,
    parseNumber(state.inflation),
  );
  const period = state.period;
  const suffix = PAY_PERIOD_SUFFIX[period];
  // With an annual period the per-period and per-year figures are identical,
  // so drop the parenthetical rather than printing the same number twice.
  const annualised = period === "annual";

  const lines: string[] = [];
  lines.push(
    annualised
      ? `Current pay: ${formatCurrency(currentAnnual, true)} per year`
      : `Current pay: ${formatCurrency(parseNumber(state.pay))} ${suffix} (${formatCurrency(currentAnnual, true)} per year)`,
  );
  lines.push("");

  state.scenarios.forEach((sc) => {
    const r = computeRaise(currentAnnual, sc, schedule);
    lines.push(`${sc.label}`);
    lines.push(`  Raise: ${formatPercent(r.percent)}`);
    lines.push(
      annualised
        ? `  New pay: ${formatCurrency(r.newAnnual, true)} per year`
        : `  New pay: ${formatCurrency(r.next[period])} ${suffix} (${formatCurrency(r.newAnnual, true)} per year)`,
    );
    lines.push(
      annualised
        ? `  Increase: ${formatSigned(r.increaseAnnual)} per year`
        : `  Increase: ${formatSigned(r.increase[period])} ${suffix}, ${formatSigned(r.increaseAnnual)} per year`,
    );
    if (taxRate !== null && taxRate > 0 && taxRate < 100) {
      lines.push(
        `  Est. take-home at ${taxRate}%: ${formatCurrency(applyEstimatedRate(r.newAnnual, taxRate), true)} per year (scenario estimate, not a tax calculation)`,
      );
    }
    lines.push("");
  });

  lines.push(
    `After inflation of ${Number(parseNumber(state.inflation).toFixed(2))}% (your figure):`,
  );
  lines.push(`  ${realRaiseVerdict(real)}`);
  lines.push(
    `  Real raise: ${formatPercent(real.realPercent)} · buying power ${formatSigned(real.purchasingPowerChange)}`,
  );
  lines.push(
    `  New salary in today's money: ${formatCurrency(real.realNewAnnual, true)}`,
  );
  lines.push(
    `  Needed just to keep pace: ${formatCurrency(real.breakEvenAnnual, true)}`,
  );
  lines.push("");
  lines.push(
    `Based on ${schedule.hoursPerWeek} hours per week, ${schedule.weeksPerYear} weeks per year.`,
  );
  return lines.join("\n");
}
