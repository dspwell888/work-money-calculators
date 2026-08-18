"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BreakdownTable,
  CopyButton,
  deltaTone,
  Field,
  Headline,
  MoneyInput,
  Panel,
  PanelHead,
  PlainInput,
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import { formatCurrency, parseNumber } from "@/lib/salary";
import { computeOvertime, type OvertimeTier } from "@/lib/work-math";

const MAX_TIERS = 3;

/** Presets people actually mean when they say "time and a half". */
const MULTIPLIER_PRESETS = [
  { value: 1.5, label: "Time and a half" },
  { value: 2, label: "Double time" },
  { value: 2.5, label: "Double time and a half" },
];

interface State {
  baseRate: string;
  regularHours: string;
  tiers: { hours: string; multiplier: string }[];
}

const INITIAL: State = {
  baseRate: "22",
  regularHours: "40",
  tiers: [{ hours: "8", multiplier: "1.5" }],
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("rate", s.baseRate);
  q.set("reg", s.regularHours);
  s.tiers.forEach((t, i) => {
    q.set(`oh${i}`, t.hours);
    q.set(`om${i}`, t.multiplier);
  });
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("rate")) return null;
  const tiers: { hours: string; multiplier: string }[] = [];
  for (let i = 0; i < MAX_TIERS; i++) {
    const h = q.get(`oh${i}`);
    const m = q.get(`om${i}`);
    if (h === null && m === null) break;
    tiers.push({ hours: h ?? "0", multiplier: m ?? "1.5" });
  }
  return {
    baseRate: q.get("rate") ?? INITIAL.baseRate,
    regularHours: q.get("reg") ?? INITIAL.regularHours,
    tiers: tiers.length ? tiers : INITIAL.tiers,
  };
}

export function OvertimeCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const baseRate = parseNumber(state.baseRate);
  const regularHours = parseNumber(state.regularHours);

  const tiers: OvertimeTier[] = state.tiers.map((t, i) => ({
    id: `t${i}`,
    hours: parseNumber(t.hours),
    multiplier: parseNumber(t.multiplier) || 1,
  }));

  const result = computeOvertime(baseRate, regularHours, tiers);

  const setTier = (i: number, next: Partial<{ hours: string; multiplier: string }>) =>
    setState((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t, j) => (j === i ? { ...t, ...next } : t)),
    }));

  const addTier = () =>
    setState((prev) =>
      prev.tiers.length >= MAX_TIERS
        ? prev
        : { ...prev, tiers: [...prev.tiers, { hours: "4", multiplier: "2" }] },
    );

  const removeTier = (i: number) =>
    setState((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, j) => j !== i),
    }));

  const rows = [
    {
      label: `Regular pay · ${regularHours} h at ${formatCurrency(baseRate)}`,
      value: formatCurrency(result.regularPay),
    },
    ...result.tiers.map((t, i) => ({
      label: `Overtime ${i + 1} · ${t.tier.hours} h at ${t.tier.multiplier}x`,
      value: formatCurrency(t.pay),
      note: formatCurrency(t.rate) + "/h",
      noteTone: "gain" as const,
    })),
    {
      label: "Total overtime pay",
      value: formatCurrency(result.overtimePay),
      noteTone: deltaTone(result.overtimePay),
    },
    {
      label: "Gross pay for the week",
      value: formatCurrency(result.totalPay),
      emphasis: true,
    },
    {
      label: `Blended rate over ${result.totalHours} h`,
      value: formatCurrency(result.blendedRate) + "/h",
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="Your regular pay" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Base hourly rate"
            htmlFor="base-rate"
            hint="Your normal rate, before any multiplier"
          >
            <MoneyInput
              id="base-rate"
              value={state.baseRate}
              onChange={(baseRate) => patch({ baseRate })}
            />
          </Field>
          <Field
            label="Regular hours this week"
            htmlFor="regular-hours"
            hint="Hours paid at the base rate"
          >
            <PlainInput
              id="regular-hours"
              value={state.regularHours}
              onChange={(regularHours) => patch({ regularHours })}
            />
          </Field>
        </div>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            Overtime
          </h2>
          {state.tiers.length < MAX_TIERS && (
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="size-3.5" />
              Add a rate
            </Button>
          )}
        </div>

        <Panel>
          <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
            <div className="rule-b flex flex-col gap-6 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
              {state.tiers.map((t, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="kicker">Rate {i + 1}</span>
                    {state.tiers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove rate ${i + 1}`}
                        onClick={() => removeTier(i)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Hours" htmlFor={`ot-hours-${i}`}>
                      <PlainInput
                        id={`ot-hours-${i}`}
                        value={t.hours}
                        onChange={(hours) => setTier(i, { hours })}
                      />
                    </Field>
                    <Field label="Multiplier" htmlFor={`ot-mult-${i}`}>
                      <SuffixInput
                        id={`ot-mult-${i}`}
                        value={t.multiplier}
                        onChange={(multiplier) => setTier(i, { multiplier })}
                        suffix="×"
                      />
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MULTIPLIER_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() =>
                          setTier(i, { multiplier: String(p.value) })
                        }
                        aria-pressed={parseNumber(t.multiplier) === p.value}
                        className={
                          parseNumber(t.multiplier) === p.value
                            ? "rounded-sm border border-foreground bg-foreground px-2 py-1 font-mono text-xs text-background"
                            : "rounded-sm border border-[var(--rule)] px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                        }
                      >
                        {p.value}×
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
                Add a second rate when the week splits — many agreements pay
                time and a half up to a threshold and double time beyond it, or
                double time on a Sunday.
              </p>
            </div>

            <div className="flex flex-col">
              <Headline
                kicker="Gross pay this week"
                value={formatCurrency(result.totalPay)}
                unit={`${result.totalHours} hours`}
                delta={
                  <>
                    {formatCurrency(result.overtimePay)} of it is overtime
                    <span className="mx-2 text-muted-foreground">·</span>
                    {formatCurrency(result.blendedRate)}/h blended
                  </>
                }
                deltaTone={deltaTone(result.overtimePay)}
              />
              <BreakdownTable caption="Line by line" rows={rows} />
            </div>
          </div>
        </Panel>
      </section>

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
  result: ReturnType<typeof computeOvertime>,
  baseRate: number,
): string {
  const lines: string[] = [];
  lines.push(`Base rate: ${formatCurrency(baseRate)} an hour`);
  lines.push(
    `Regular: ${state.regularHours} h = ${formatCurrency(result.regularPay)}`,
  );
  result.tiers.forEach((t, i) => {
    lines.push(
      `Overtime ${i + 1}: ${t.tier.hours} h at ${t.tier.multiplier}x (${formatCurrency(t.rate)}/h) = ${formatCurrency(t.pay)}`,
    );
  });
  lines.push("");
  lines.push(`Overtime pay: ${formatCurrency(result.overtimePay)}`);
  lines.push(`Gross pay: ${formatCurrency(result.totalPay)}`);
  lines.push(
    `Blended rate: ${formatCurrency(result.blendedRate)} an hour over ${result.totalHours} hours`,
  );
  return lines.join("\n");
}
