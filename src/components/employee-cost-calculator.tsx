"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { computeEmployeeCost, type BenefitLine } from "@/lib/rates";

const MAX_BENEFITS = 6;

interface State {
  baseSalary: string;
  employerCharges: string;
  oneOffCosts: string;
  productiveHours: string;
  benefits: { name: string; amount: string }[];
}

const INITIAL: State = {
  baseSalary: "60000",
  employerCharges: "12",
  oneOffCosts: "5000",
  productiveHours: "1800",
  benefits: [
    { name: "Health cover", amount: "6000" },
    { name: "Pension", amount: "3000" },
  ],
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("base", s.baseSalary);
  q.set("ec", s.employerCharges);
  q.set("oneoff", s.oneOffCosts);
  q.set("hours", s.productiveHours);
  s.benefits.forEach((b, i) => {
    q.set(`bn${i}`, b.name);
    q.set(`ba${i}`, b.amount);
  });
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("base")) return null;
  const benefits: { name: string; amount: string }[] = [];
  for (let i = 0; i < MAX_BENEFITS; i++) {
    const a = q.get(`ba${i}`);
    if (a === null) break;
    benefits.push({ name: q.get(`bn${i}`) ?? `Benefit ${i + 1}`, amount: a });
  }
  return {
    baseSalary: q.get("base") ?? INITIAL.baseSalary,
    employerCharges: q.get("ec") ?? INITIAL.employerCharges,
    oneOffCosts: q.get("oneoff") ?? INITIAL.oneOffCosts,
    productiveHours: q.get("hours") ?? INITIAL.productiveHours,
    benefits: benefits.length ? benefits : INITIAL.benefits,
  };
}

export function EmployeeCostCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const setBenefit = (i: number, next: Partial<{ name: string; amount: string }>) =>
    setState((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b, j) => (j === i ? { ...b, ...next } : b)),
    }));

  const addBenefit = () =>
    setState((prev) =>
      prev.benefits.length >= MAX_BENEFITS
        ? prev
        : { ...prev, benefits: [...prev.benefits, { name: "", amount: "0" }] },
    );

  const removeBenefit = (i: number) =>
    setState((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, j) => j !== i),
    }));

  const benefits: BenefitLine[] = state.benefits.map((b, i) => ({
    id: `b${i}`,
    name: b.name || `Benefit ${i + 1}`,
    amount: parseNumber(b.amount),
  }));

  const result = computeEmployeeCost({
    baseSalary: parseNumber(state.baseSalary),
    employerChargesPercent: parseNumber(state.employerCharges),
    benefits,
    oneOffCosts: parseNumber(state.oneOffCosts),
    productiveHoursPerYear: parseNumber(state.productiveHours),
  });

  const rows = [
    { label: "Base salary", value: formatCurrency(result.baseSalary, true) },
    {
      label: `Employer charges at ${state.employerCharges}%`,
      value: formatCurrency(result.employerCharges, true),
      noteTone: "loss" as const,
    },
    ...benefits.map((b) => ({
      label: `  ${b.name}`,
      value: formatCurrency(b.amount, true),
    })),
    {
      label: "Benefits total",
      value: formatCurrency(result.benefitsTotal, true),
    },
    {
      label: "Recurring cost each year",
      value: formatCurrency(result.recurringTotal, true),
      emphasis: true,
    },
    {
      label: "Overhead above the salary",
      value: formatCurrency(result.overhead, true),
      noteTone: "loss" as const,
    },
    {
      label: "First-year one-offs",
      value: formatCurrency(result.oneOffCosts, true),
    },
    {
      label: "First year, all in",
      value: formatCurrency(result.firstYearTotal, true),
      emphasis: true,
    },
    {
      label: `Cost per productive hour (${state.productiveHours} h)`,
      value: formatCurrency(result.costPerHour),
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="The salary and the charges on it" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field label="Base salary" htmlFor="base" hint="Gross, per year">
            <MoneyInput
              id="base"
              value={state.baseSalary}
              onChange={(baseSalary) => patch({ baseSalary })}
            />
          </Field>
          <Field
            label="Employer charges"
            htmlFor="ec"
            hint="Your own figure — nothing is assumed"
          >
            <SuffixInput
              id="ec"
              value={state.employerCharges}
              onChange={(employerCharges) => patch({ employerCharges })}
              suffix="%"
            />
          </Field>
        </div>
        <p className="rule-t max-w-prose px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-7">
          <strong className="font-medium text-foreground">
            No rates are built in.
          </strong>{" "}
          Employer-side charges differ by country, by headcount, and by year.
          The percentage above is whatever you type — take it from your own
          payroll reports or your accountant, not from a calculator.
        </p>
      </Panel>

      <section className="flex flex-col gap-5">
        <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
          <h2 className="font-heading text-xl">
            <span className="kicker mr-3 align-middle">02</span>
            Benefits and one-offs
          </h2>
          {state.benefits.length < MAX_BENEFITS && (
            <Button variant="outline" size="sm" onClick={addBenefit}>
              <Plus className="size-3.5" />
              Add a benefit
            </Button>
          )}
        </div>

        <Panel>
          <div className="grid grid-cols-[1fr_12rem_auto] items-baseline gap-3 px-5 py-3 sm:px-7">
            <span className="kicker">Benefit</span>
            <span className="kicker">Annual cost</span>
            <span className="w-8" />
          </div>
          {state.benefits.map((b, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_12rem_auto] items-center gap-3 border-t border-[var(--rule)] px-5 py-3 sm:px-7"
            >
              <PlainInput
                ariaLabel={`Benefit name ${i + 1}`}
                value={b.name}
                onChange={(name) => setBenefit(i, { name })}
                placeholder={`Benefit ${i + 1}`}
                className="h-9 font-sans text-base"
              />
              <MoneyInput
                ariaLabel={`Benefit cost ${i + 1}`}
                value={b.amount}
                onChange={(amount) => setBenefit(i, { amount })}
                className="h-9 text-base"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove benefit ${i + 1}`}
                onClick={() => removeBenefit(i)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
          <div className="grid gap-x-10 gap-y-6 border-t border-[var(--rule)] px-5 py-6 sm:grid-cols-2 sm:px-7">
            <Field
              label="First-year one-off costs"
              htmlFor="oneoff"
              hint="Recruitment, equipment, onboarding"
            >
              <MoneyInput
                id="oneoff"
                value={state.oneOffCosts}
                onChange={(oneOffCosts) => patch({ oneOffCosts })}
              />
            </Field>
            <Field
              label="Productive hours a year"
              htmlFor="hours"
              hint="Paid hours less holiday, training, admin"
            >
              <PlainInput
                id="hours"
                value={state.productiveHours}
                onChange={(productiveHours) => patch({ productiveHours })}
              />
            </Field>
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rule-b flex flex-col gap-3 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <span className="kicker">The multiple</span>
            <div className="font-heading text-5xl leading-none tracking-tight">
              {result.multiple.toFixed(2)}×
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              What one dollar of salary actually costs. Anything from 1.15 to
              1.4 is common; the figure depends far more on benefits and
              employer charges than on the salary itself.
            </p>
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              The recurring total is the number to budget with. The first-year
              figure includes one-offs and will not repeat.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Recurring cost each year"
              value={formatCurrency(result.recurringTotal, true)}
              unit={`${result.multiple.toFixed(2)}× base salary`}
              delta={
                <>
                  {formatCurrency(result.overhead, true)} above the salary
                  <span className="mx-2 text-muted-foreground">·</span>
                  {formatCurrency(result.costPerHour)} per productive hour
                </>
              }
              deltaTone="loss"
            />
            <BreakdownTable caption="Line by line" rows={rows} />
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <CopyButton getValue={() => buildSummary(state, benefits, result)} />
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
  benefits: BenefitLine[],
  result: ReturnType<typeof computeEmployeeCost>,
): string {
  const lines: string[] = [];
  lines.push(`Base salary:      ${formatCurrency(result.baseSalary, true)}`);
  lines.push(
    `Employer charges: ${formatCurrency(result.employerCharges, true)} (${state.employerCharges}%, user-supplied)`,
  );
  benefits.forEach((b) => {
    lines.push(`  ${b.name.padEnd(16)}${formatCurrency(b.amount, true)}`);
  });
  lines.push("");
  lines.push(
    `Recurring cost:   ${formatCurrency(result.recurringTotal, true)} (${result.multiple.toFixed(2)}× salary)`,
  );
  lines.push(`One-off costs:    ${formatCurrency(result.oneOffCosts, true)}`);
  lines.push(`First year:       ${formatCurrency(result.firstYearTotal, true)}`);
  lines.push(
    `Per productive hour: ${formatCurrency(result.costPerHour)} over ${state.productiveHours} h`,
  );
  lines.push("");
  lines.push(
    "Employer charges use a percentage you supplied. No tax rates are built in.",
  );
  return lines.join("\n");
}
