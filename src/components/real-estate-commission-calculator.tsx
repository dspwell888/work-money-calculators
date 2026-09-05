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
  SuffixInput,
  useUrlState,
} from "@/components/calc-ui";
import { formatCurrency, parseNumber } from "@/lib/salary";
import { computeCommissionSplit } from "@/lib/rates";

interface State {
  salePrice: string;
  totalRate: string;
  listingShare: string;
  listingAgentSplit: string;
  buyingAgentSplit: string;
}

const INITIAL: State = {
  salePrice: "500000",
  totalRate: "5",
  listingShare: "50",
  listingAgentSplit: "60",
  buyingAgentSplit: "60",
};

function encode(s: State): string {
  const q = new URLSearchParams();
  q.set("price", s.salePrice);
  q.set("rate", s.totalRate);
  q.set("ls", s.listingShare);
  q.set("las", s.listingAgentSplit);
  q.set("bas", s.buyingAgentSplit);
  return q.toString();
}

function decode(search: string): State | null {
  const q = new URLSearchParams(search);
  if (!q.has("price")) return null;
  return {
    salePrice: q.get("price") ?? INITIAL.salePrice,
    totalRate: q.get("rate") ?? INITIAL.totalRate,
    listingShare: q.get("ls") ?? INITIAL.listingShare,
    listingAgentSplit: q.get("las") ?? INITIAL.listingAgentSplit,
    buyingAgentSplit: q.get("bas") ?? INITIAL.buyingAgentSplit,
  };
}

export function RealEstateCommissionCalculator() {
  const [state, setState] = useUrlState<State>(INITIAL, decode, encode);
  const patch = (next: Partial<State>) =>
    setState((prev) => ({ ...prev, ...next }));

  const listingShare = parseNumber(state.listingShare);
  const result = computeCommissionSplit({
    salePrice: parseNumber(state.salePrice),
    totalRatePercent: parseNumber(state.totalRate),
    listingSharePercent: listingShare,
    listingAgentSplitPercent: parseNumber(state.listingAgentSplit),
    buyingAgentSplitPercent: parseNumber(state.buyingAgentSplit),
  });

  const rows = [
    {
      label: `Total commission at ${state.totalRate}%`,
      value: formatCurrency(result.totalCommission, true),
      emphasis: true,
    },
    {
      label: `Listing side · ${listingShare}%`,
      value: formatCurrency(result.listingSide, true),
    },
    {
      label: `  Listing agent · ${state.listingAgentSplit}% of that side`,
      value: formatCurrency(result.listingAgent, true),
      noteTone: "gain" as const,
    },
    {
      label: "  Listing brokerage",
      value: formatCurrency(result.listingBrokerage, true),
    },
    {
      label: `Buying side · ${100 - listingShare}%`,
      value: formatCurrency(result.buyingSide, true),
    },
    {
      label: `  Buyer's agent · ${state.buyingAgentSplit}% of that side`,
      value: formatCurrency(result.buyingAgent, true),
      noteTone: "gain" as const,
    },
    {
      label: "  Buyer's brokerage",
      value: formatCurrency(result.buyingBrokerage, true),
    },
    {
      label: "Seller keeps, before other costs",
      value: formatCurrency(result.netToSeller, true),
      emphasis: true,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <Panel>
        <PanelHead index="01" title="The sale" />
        <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <Field label="Sale price" htmlFor="price">
            <MoneyInput
              id="price"
              value={state.salePrice}
              onChange={(salePrice) => patch({ salePrice })}
            />
          </Field>
          <Field
            label="Total commission rate"
            htmlFor="rate"
            hint="Everything both sides charge, combined"
          >
            <SuffixInput
              id="rate"
              value={state.totalRate}
              onChange={(totalRate) => patch({ totalRate })}
              suffix="%"
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="rule-b flex flex-col gap-5 px-5 py-6 sm:px-7 lg:border-r lg:border-b-0 lg:border-r-[var(--rule)]">
            <Field
              label="Listing side's share"
              htmlFor="ls"
              hint={`Buying side takes the other ${100 - listingShare}%`}
            >
              <SuffixInput
                id="ls"
                value={state.listingShare}
                onChange={(listingShare) => patch({ listingShare })}
                suffix="%"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Listing agent keeps" htmlFor="las">
                <SuffixInput
                  id="las"
                  value={state.listingAgentSplit}
                  onChange={(listingAgentSplit) => patch({ listingAgentSplit })}
                  suffix="%"
                />
              </Field>
              <Field label="Buyer's agent keeps" htmlFor="bas">
                <SuffixInput
                  id="bas"
                  value={state.buyingAgentSplit}
                  onChange={(buyingAgentSplit) => patch({ buyingAgentSplit })}
                  suffix="%"
                />
              </Field>
            </div>

            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              The order matters: the total splits between the two sides first,
              then each brokerage splits its own side with its own agent. An
              agent&rsquo;s percentage is a share of their side, never of the
              whole commission.
            </p>
          </div>

          <div className="flex flex-col">
            <Headline
              kicker="Total commission"
              value={formatCurrency(result.totalCommission, true)}
              unit={`${result.effectiveRate.toFixed(2)}% of the sale price`}
              delta={
                <>
                  Listing agent {formatCurrency(result.listingAgent, true)}
                  <span className="mx-2 text-muted-foreground">·</span>
                  Buyer&rsquo;s agent {formatCurrency(result.buyingAgent, true)}
                </>
              }
              deltaTone="gain"
            />
            <BreakdownTable
              caption="Who gets what"
              captionNote={`on ${formatCurrency(parseNumber(state.salePrice), true)}`}
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
  result: ReturnType<typeof computeCommissionSplit>,
): string {
  const lines: string[] = [];
  lines.push(
    `Sale price: ${formatCurrency(parseNumber(state.salePrice), true)} at ${state.totalRate}%`,
  );
  lines.push("");
  lines.push(
    `Total commission:   ${formatCurrency(result.totalCommission, true)}`,
  );
  lines.push(
    `  Listing side:     ${formatCurrency(result.listingSide, true)}`,
  );
  lines.push(
    `    Agent:          ${formatCurrency(result.listingAgent, true)}`,
  );
  lines.push(
    `    Brokerage:      ${formatCurrency(result.listingBrokerage, true)}`,
  );
  lines.push(`  Buying side:      ${formatCurrency(result.buyingSide, true)}`);
  lines.push(`    Agent:          ${formatCurrency(result.buyingAgent, true)}`);
  lines.push(
    `    Brokerage:      ${formatCurrency(result.buyingBrokerage, true)}`,
  );
  lines.push("");
  lines.push(
    `Seller keeps:       ${formatCurrency(result.netToSeller, true)} before other costs`,
  );
  return lines.join("\n");
}
