"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

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

/**
 * Shared building blocks for every calculator on the site: bordered panels,
 * hairline-ruled tables, underlined inputs, and the copy button. Keeping them
 * in one place is what stops six calculators drifting into six designs.
 */

export function Panel({
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

export function PanelHead({
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

export function SectionHead({
  index,
  title,
  action,
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rule-b flex items-baseline justify-between gap-4 pb-3">
      <h2 className="font-heading text-xl">
        <span className="kicker mr-3 align-middle">{index}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Field({
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

export const INPUT_CLASS =
  "h-11 rounded-sm border-0 border-b border-input bg-transparent px-0 font-mono text-lg tabular-nums shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent";

export function PlainInput({
  id,
  value,
  onChange,
  className,
  placeholder,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <Input
      id={id}
      aria-label={ariaLabel}
      inputMode="decimal"
      placeholder={placeholder}
      className={cn(INPUT_CLASS, className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function MoneyInput({
  id,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center font-mono text-lg text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        aria-label={ariaLabel}
        inputMode="decimal"
        className={cn(INPUT_CLASS, "pl-5", className)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SuffixInput({
  id,
  value,
  onChange,
  suffix,
  ariaLabel,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <PlainInput
        id={id}
        ariaLabel={ariaLabel}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-10"
      />
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-sm text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}

export function ChoiceSelect<T extends string>({
  id,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  id?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className="h-11 w-full rounded-sm border-0 border-b border-input px-0 text-base shadow-none focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-sm">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="rounded-sm">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ModeTabs<T extends string>({
  value,
  onChange,
  options,
  compact = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  compact?: boolean;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)}>
      <TabsList variant="line" className="h-auto w-full gap-4 p-0">
        {options.map((o) => (
          <TabsTrigger
            key={o.value}
            value={o.value}
            className={cn(
              "h-auto flex-none rounded-none px-0 pb-1.5 font-normal",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** The hero figure: a big serif number with a caption and a delta line. */
export function Headline({
  kicker,
  value,
  unit,
  delta,
  deltaTone = "neutral",
}: {
  kicker: string;
  value: string;
  unit?: string;
  delta?: React.ReactNode;
  deltaTone?: "gain" | "loss" | "neutral";
}) {
  return (
    <div className="px-5 py-6 sm:px-7">
      <span className="kicker">{kicker}</span>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <span className="font-heading text-[clamp(2.75rem,7vw,4rem)] leading-[0.9] tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
      {delta && (
        <p
          className={cn(
            "mt-3 font-mono text-sm tabular-nums",
            deltaTone === "gain" && "text-gain",
            deltaTone === "loss" && "text-loss",
            deltaTone === "neutral" && "text-muted-foreground",
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

export interface BreakdownRow {
  label: string;
  value: string;
  /** Secondary right-hand column, usually a delta. */
  note?: string;
  noteTone?: "gain" | "loss" | "neutral";
  emphasis?: boolean;
}

/** The ruled figure table used under every headline on the site. */
export function BreakdownTable({
  caption,
  captionNote,
  rows,
}: {
  caption: string;
  captionNote?: string;
  rows: BreakdownRow[];
}) {
  return (
    <div className="rule-t mt-auto">
      <div className="flex items-baseline justify-between gap-4 px-5 pt-4 pb-2 sm:px-7">
        <span className="kicker">{caption}</span>
        {captionNote && (
          <span className="kicker hidden sm:block">{captionNote}</span>
        )}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.label}
              className={cn(
                "border-t border-[var(--rule)]",
                r.emphasis && "bg-accent/60",
              )}
            >
              <th
                scope="row"
                className="py-2 pr-3 pl-5 text-left font-normal text-muted-foreground sm:pl-7"
              >
                {r.label}
              </th>
              <td
                className={cn(
                  "py-2 text-right font-mono tabular-nums",
                  r.emphasis && "font-medium",
                )}
              >
                {r.value}
              </td>
              <td
                className={cn(
                  "w-28 py-2 pr-5 pl-3 text-right font-mono text-[0.8125rem] tabular-nums sm:pr-7",
                  r.noteTone === "gain" && "text-gain",
                  r.noteTone === "loss" && "text-loss",
                  (!r.noteTone || r.noteTone === "neutral") &&
                    "text-muted-foreground",
                )}
              >
                {r.note ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CopyButton({
  getValue,
  idleLabel = "Copy summary",
  doneLabel = "Summary copied",
  icon,
  variant = "default",
}: {
  getValue: () => string;
  idleLabel?: string;
  doneLabel?: string;
  icon?: React.ReactNode;
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
      {state === "copied" ? (
        <Check className="size-3.5" />
      ) : (
        (icon ?? <Copy className="size-3.5" />)
      )}
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

/** Green is a gain, oxblood is a loss, neutral is no change. */
export function deltaTone(value: number): "gain" | "loss" | "neutral" {
  if (value > 0) return "gain";
  if (value < 0) return "loss";
  return "neutral";
}

/**
 * Restore state from the query string after mount and keep the address bar
 * shareable. Static HTML is built once for every visitor, so reading
 * window.location during render would make the first client render disagree
 * with it.
 */
export function useUrlState<T>(
  initial: T,
  decode: (search: string) => T | null,
  encode: (state: T) => string,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(initial);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const fromUrl = decode(window.location.search);
    if (fromUrl) setState(fromUrl);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // decode is defined at module scope in every caller; re-running on a new
    // identity would clobber user input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${encode(state)}`,
      );
    }, 400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, hydrated]);

  return [state, setState];
}
