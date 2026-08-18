"use client";

import * as React from "react";
import { Link2 } from "lucide-react";

import {
  BreakdownTable,
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
import { formatCurrency, parseNumber } from "@/lib/salary";
import { computeNannyPay } from "@/lib/billing";

interface State {
  hourlyRate: string;
  regularHours: string;
  overtimeHours: string;
  overtimeMultiplier: string;
  extraChildren: string;
  perExtraChildRate: string;
  extras: string;
}

const INITIAL: State = {
  hourlyRate: "22",
  regularHours: "30",
  overtimeHours: "0",
  overtimeMultiplier: "1.5",
  extraChildren: "0",
  perExtraChildRate: "2",
  extras: "0",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("rate", s.hourlyRate);
  q.set("h", s.regularHours);
  if (parseNumber(s.overtimeHours) > 0) {
    q.set("oth", s.overtimeHours);
    q.set("otm", s.overtimeMultiplier);
  }
  if (parseNumber(s.extraChildren) > 0) {
    q.set("kids", s.extraChildren);
    q.set("kr", s.perExtraChildRate);
  }
  if (parseNumber(s.extras) !== 0) q.set("x", s.extras);
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("rate")) return null;
  return {
    hourlyRate: q.get("rate") ?? INITIAL.hourlyRate,
    regularHours: q.get("h") ?? INITIAL.regularHours,
    overtimeHours: q.get("oth") ?? "0",
    overtimeMultiplier: q.get("otm") ?? INITIAL.overtimeMultiplier,
    extraChildren: q.get("kids") ?? "0",
    perExtraChildRate: q.get("kr") ?? INITIAL.perExtraChildRate,
    extras: q.get("x") ?? "0",
  };
}

export function NannyPayCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);

  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const extraChildren = parseNumber(state.extraChildren);
  const result = computeNannyPay({
    hourlyRate: parseNumber(state.hourlyRate),
    regularHours: parseNumber(state.regularHours),
    overtimeHours: parseNumber(state.overtimeHours),
    overtimeMultiplier: parseNumber(state.overtimeMultiplier) || 1.5,
    extraChildren,
    perExtraChildRate: parseNumber(state.perExtraChildRate),
    extras: parseNumber(state.extras),
  });

  const rows = [
    {
      label: "Base rate",
      value: `${formatCurrency(parseNumber(state.hourlyRate))}/h`,
    },
    ...(extraChildren > 0
      ? [
          {
            label: `Uplift for ${extraChildren} extra ${extraChildren === 1 ? "child" : "children"}`,
            value: `+${formatCurrency(extraChildren * parseNumber(state.perExtraChildRate))}/h`,
            noteTone: "gain" as const,
          },
          {
            label: "Rate actually worked",
            value: `${formatCurrency(result.effectiveRate)}/h`,
            emphasis: true,
          },
        ]
      : []),
    {
      label: `Regular · ${state.regularHours} h`,
      value: formatCurrency(result.regularPay),
    },
    ...(result.overtimePay > 0
      ? [
          {
            label: `Overtime · ${state.overtimeHours} h at ${state.overtimeMultiplier}x`,
            value: formatCurrency(result.overtimePay),
            note: `${formatCurrency(result.overtimeRate)}/h`,
            noteTone: "gain" as const,
          },
        ]
      : []),
    ...(result.extras !== 0
      ? [{ label: "Extras and expenses", value: formatCurrency(result.extras) }]
      : []),
    {
      label: "Total to pay",
      value: formatCurrency(result.total, true),
      emphasis: true,
    },
    {
      label: `Average over ${result.totalHours} h`,
      value: `${formatCurrency(result.blendedRate)}/h`,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="The agreed rate" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field
            label="Hourly rate"
            htmlFor="rate"
            hint="For one child, before any uplift"
          >
            <MoneyInput
              id="rate"
              value={state.hourlyRate}
              onChange={(hourlyRate) => patch({ hourlyRate })}
            />
          </Field>
          <Field
            label="Hours worked"
            htmlFor="hours"
            hint="At the regular rate"
          >
            <PlainInput
              id="hours"
              value={state.regularHours}
              onChange={(regularHours) => patch({ regularHours })}
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Extra children" htmlFor="kids">
                <PlainInput
                  id="kids"
                  value={state.extraChildren}
                  onChange={(extraChildren) => patch({ extraChildren })}
                />
              </Field>
              <Field label="Each adds" htmlFor="kr">
                <MoneyInput
                  id="kr"
                  value={state.perExtraChildRate}
                  onChange={(perExtraChildRate) => patch({ perExtraChildRate })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Overtime hours" htmlFor="oth">
                <PlainInput
                  id="oth"
                  value={state.overtimeHours}
                  onChange={(overtimeHours) => patch({ overtimeHours })}
                />
              </Field>
              <Field label="At multiplier" htmlFor="otm">
                <SuffixInput
                  id="otm"
                  value={state.overtimeMultiplier}
                  onChange={(overtimeMultiplier) =>
                    patch({ overtimeMultiplier })
                  }
                  suffix="×"
                />
              </Field>
            </div>

            <Field
              label="Extras"
              htmlFor="extras"
              hint="Travel, late fee, holiday bonus"
            >
              <MoneyInput
                id="extras"
                value={state.extras}
                onChange={(extras) => patch({ extras })}
              />
            </Field>

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              The per-child uplift raises the hourly rate, so overtime is
              worked out on the uplifted rate — the rate actually being worked,
              not the headline one.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Total to pay"
              value={formatCurrency(result.total, true)}
              unit={`for ${result.totalHours} hours`}
              delta={
                <>
                  {formatCurrency(result.effectiveRate)}/h worked
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatCurrency(result.blendedRate)}/h average
                </>
              }
              deltaTone="neutral"
            />
            <BreakdownTable caption="Line by line" rows={rows} />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHead index="—" title="What this does not do" />
        <p className="max-w-prose px-5 py-5 text-[0.8125rem] leading-relaxed text-muted-foreground sm:px-7">
          <strong className="font-medium text-foreground">
            No deductions, no household employment tax.
          </strong>{" "}
          Employing someone in your home carries its own rules, and they differ
          by country and by how much you pay. Every figure here is the gross
          amount agreed between you — what actually has to be withheld or filed
          is a question for a professional, not a calculator.
        </p>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, result)} />
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
  result: ReturnType<typeof computeNannyPay>,
): string {
  const lines: string[] = [];
  lines.push(`Rate: ${formatCurrency(parseNumber(state.hourlyRate))}/h`);
  if (parseNumber(state.extraChildren) > 0) {
    lines.push(
      `Extra children: ${state.extraChildren} at +${formatCurrency(parseNumber(state.perExtraChildRate))}/h → ${formatCurrency(result.effectiveRate)}/h`,
    );
  }
  lines.push("");
  lines.push(
    `  Regular  ${state.regularHours} h = ${formatCurrency(result.regularPay)}`,
  );
  if (result.overtimePay > 0) {
    lines.push(
      `  Overtime ${state.overtimeHours} h at ${state.overtimeMultiplier}x (${formatCurrency(result.overtimeRate)}/h) = ${formatCurrency(result.overtimePay)}`,
    );
  }
  if (result.extras !== 0) {
    lines.push(`  Extras   ${formatCurrency(result.extras)}`);
  }
  lines.push("");
  lines.push(`Total: ${formatCurrency(result.total, true)} gross`);
  lines.push(
    `Average: ${formatCurrency(result.blendedRate)} an hour over ${result.totalHours} hours`,
  );
  lines.push("");
  lines.push("Gross only — no deductions or household employment tax applied.");
  return lines.join("\n");
}
