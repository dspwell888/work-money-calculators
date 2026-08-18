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
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import { formatCurrency, parseNumber } from "@/lib/salary";
import { computeCommission, type CommissionBracket } from "@/lib/work-math";

type Structure = "flat" | "tiered";

const MAX_BRACKETS = 4;

interface State {
  structure: Structure;
  sales: string;
  flatRate: string;
  basePay: string;
  brackets: { from: string; rate: string }[];
}

const INITIAL: State = {
  structure: "flat",
  sales: "250000",
  flatRate: "5",
  basePay: "0",
  brackets: [
    { from: "0", rate: "3" },
    { from: "100000", rate: "5" },
    { from: "250000", rate: "8" },
  ],
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("st", s.structure);
  q.set("sales", s.sales);
  q.set("base", s.basePay);
  if (s.structure === "flat") {
    q.set("rate", s.flatRate);
  } else {
    s.brackets.forEach((b, i) => {
      q.set(`bf${i}`, b.from);
      q.set(`br${i}`, b.rate);
    });
  }
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("sales")) return null;
  const brackets: { from: string; rate: string }[] = [];
  for (let i = 0; i < MAX_BRACKETS; i++) {
    const f = q.get(`bf${i}`);
    const r = q.get(`br${i}`);
    if (f === null && r === null) break;
    brackets.push({ from: f ?? "0", rate: r ?? "0" });
  }
  return {
    structure: q.get("st") === "tiered" ? "tiered" : "flat",
    sales: q.get("sales") ?? INITIAL.sales,
    flatRate: q.get("rate") ?? INITIAL.flatRate,
    basePay: q.get("base") ?? INITIAL.basePay,
    brackets: brackets.length ? brackets : INITIAL.brackets,
  };
}

export function CommissionCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const sales = parseNumber(state.sales);
  const basePay = parseNumber(state.basePay);
  const tiered = state.structure === "tiered";

  const brackets: CommissionBracket[] = tiered
    ? state.brackets.map((b, i) => ({
        id: `b${i}`,
        from: parseNumber(b.from),
        ratePercent: parseNumber(b.rate),
      }))
    : [{ id: "flat", from: 0, ratePercent: parseNumber(state.flatRate) }];

  const result = computeCommission(sales, brackets, basePay);

  const setBracket = (i: number, next: Partial<{ from: string; rate: string }>) =>
    setState((prev) => ({
      ...prev,
      brackets: prev.brackets.map((b, j) => (j === i ? { ...b, ...next } : b)),
    }));

  const addBracket = () =>
    setState((prev) => {
      if (prev.brackets.length >= MAX_BRACKETS) return prev;
      const last = prev.brackets[prev.brackets.length - 1];
      const from = parseNumber(last?.from ?? "0") * 2 || 100000;
      const rate = parseNumber(last?.rate ?? "0") + 2;
      return {
        ...prev,
        brackets: [
          ...prev.brackets,
          { from: String(from), rate: String(rate) },
        ],
      };
    });

  const removeBracket = (i: number) =>
    setState((prev) => ({
      ...prev,
      brackets: prev.brackets.filter((_, j) => j !== i),
    }));

  const rows = [
    ...result.slices.map((s) => ({
      label:
        s.to === null
          ? `${formatCurrency(s.from, true)} and above at ${s.ratePercent}%`
          : `${formatCurrency(s.from, true)} – ${formatCurrency(s.to, true)} at ${s.ratePercent}%`,
      value: formatCurrency(s.commission),
      note: formatCurrency(s.amountInBand, true),
    })),
    {
      label: "Commission earned",
      value: formatCurrency(result.commission),
      noteTone: "gain" as const,
    },
    {
      label: "Effective rate on all sales",
      value: `${result.effectiveRate.toFixed(2)}%`,
    },
    { label: "Base pay", value: formatCurrency(basePay, true) },
    {
      label: "Total earnings",
      value: formatCurrency(result.total, true),
      emphasis: true,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="Sales and base pay" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Sales in the period"
            htmlFor="sales"
            hint="The revenue commission is calculated on"
          >
            <MoneyInput
              id="sales"
              value={state.sales}
              onChange={(sales) => patch({ sales })}
            />
          </Field>
          <Field
            label="Base pay for the period"
            htmlFor="base-pay"
            hint="Leave at 0 for commission-only"
          >
            <MoneyInput
              id="base-pay"
              value={state.basePay}
              onChange={(basePay) => patch({ basePay })}
            />
          </Field>
        </div>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            Commission structure
          </h2>
          {tiered && state.brackets.length < MAX_BRACKETS && (
            <Button variant="outline" size="sm" onClick={addBracket}>
              <Plus className="size-3.5" />
              Add a tier
            </Button>
          )}
        </div>

        <Panel>
          <div className="grid lg:grid-cols-[minmax(0,24rem)_1fr]">
            <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
              <ModeTabs<Structure>
                value={state.structure}
                onChange={(structure) => patch({ structure })}
                options={[
                  { value: "flat", label: "Flat rate" },
                  { value: "tiered", label: "Tiered" },
                ]}
              />

              {tiered ? (
                <div className="flex flex-col gap-4">
                  {state.brackets.map((b, i) => (
                    <div key={i} className="flex items-end gap-3">
                      <div className="flex-1">
                        <Field label="From" htmlFor={`b-from-${i}`}>
                          <MoneyInput
                            id={`b-from-${i}`}
                            value={b.from}
                            onChange={(from) => setBracket(i, { from })}
                          />
                        </Field>
                      </div>
                      <div className="w-24">
                        <Field label="Rate" htmlFor={`b-rate-${i}`}>
                          <SuffixInput
                            id={`b-rate-${i}`}
                            value={b.rate}
                            onChange={(rate) => setBracket(i, { rate })}
                            suffix="%"
                          />
                        </Field>
                      </div>
                      {state.brackets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove tier ${i + 1}`}
                          onClick={() => removeBracket(i)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Field label="Commission rate" htmlFor="flat-rate">
                  <SuffixInput
                    id="flat-rate"
                    value={state.flatRate}
                    onChange={(flatRate) => patch({ flatRate })}
                    suffix="%"
                  />
                </Field>
              )}

              <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
                {tiered
                  ? "Each band is paid at its own rate on the sales that fall inside it, not the top rate on everything. This is how most plans are written."
                  : "One rate on every dollar of sales. Switch to Tiered when the rate steps up as you pass a threshold."}
              </p>
            </div>

            <div className="flex flex-col">
              <Headline
                kicker="Total earnings"
                value={formatCurrency(result.total, true)}
                unit="for the period"
                delta={
                  <>
                    {formatCurrency(result.commission)} commission
                    <span className="mx-2 text-muted-foreground">·</span>
                    {result.effectiveRate.toFixed(2)}% effective rate
                  </>
                }
                deltaTone="gain"
              />
              <BreakdownTable
                caption={tiered ? "Band by band" : "How it adds up"}
                captionNote={`on ${formatCurrency(sales, true)} of sales`}
                rows={rows}
              />
            </div>
          </div>
        </Panel>
      </section>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, result, sales)} />
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
  result: ReturnType<typeof computeCommission>,
  sales: number,
): string {
  const lines: string[] = [];
  lines.push(`Sales: ${formatCurrency(sales, true)}`);
  lines.push(
    state.structure === "flat"
      ? `Structure: flat ${state.flatRate}%`
      : "Structure: tiered",
  );
  lines.push("");
  result.slices.forEach((s) => {
    const band =
      s.to === null
        ? `${formatCurrency(s.from, true)}+`
        : `${formatCurrency(s.from, true)}–${formatCurrency(s.to, true)}`;
    lines.push(
      `  ${band} at ${s.ratePercent}% on ${formatCurrency(s.amountInBand, true)} = ${formatCurrency(s.commission)}`,
    );
  });
  lines.push("");
  lines.push(`Commission: ${formatCurrency(result.commission)}`);
  lines.push(`Effective rate: ${result.effectiveRate.toFixed(2)}%`);
  lines.push(`Base pay: ${formatCurrency(result.basePay, true)}`);
  lines.push(`Total earnings: ${formatCurrency(result.total, true)}`);
  return lines.join("\n");
}
