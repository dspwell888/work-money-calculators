"use client";

import * as React from "react";
import Script from "next/script";

import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/legal";

/*
  Advertising is opt-in at build time: with NEXT_PUBLIC_ADSENSE_CLIENT unset,
  none of this renders and no third-party script is requested. That keeps the
  site shippable — and reviewable by AdSense — before an account exists.

  Two rules the layout enforces, because both are ranking and UX problems:
  every slot reserves its height so nothing shifts as ads load, and no slot
  sits between the reader and a calculator result.
*/

const CONSENT_KEY = "wm-ads-consent";

type Consent = "granted" | "denied" | null;

function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    // Storage can be blocked outright; treat that as "not yet asked".
    return null;
  }
}

function writeConsent(v: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // Non-fatal: the banner reappears next visit.
  }
}

const ConsentContext = React.createContext<Consent>(null);

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = React.useState<Consent>(null);
  const [asked, setAsked] = React.useState(true);

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = readConsent();
    setConsent(stored);
    setAsked(stored !== null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const decide = (v: Exclude<Consent, null>) => {
    writeConsent(v);
    setConsent(v);
    setAsked(true);
  };

  if (!ADS_ENABLED) return <>{children}</>;

  return (
    <ConsentContext.Provider value={consent}>
      {children}
      {consent === "granted" && (
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      )}
      {!asked && <ConsentBanner onDecide={decide} />}
    </ConsentContext.Provider>
  );
}

function ConsentBanner({
  onDecide,
}: {
  onDecide: (v: "granted" | "denied") => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--rule)] bg-card px-5 py-4 sm:px-8"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This site is free because of advertising. With your agreement, Google
          may set cookies to serve ads. The calculators work either way, and
          nothing you type is ever sent anywhere.{" "}
          <a
            href="/privacy-policy/"
            className="underline underline-offset-4 hover:no-underline"
          >
            Privacy policy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onDecide("denied")}
            className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm transition-colors hover:border-foreground"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onDecide("granted")}
            className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-85"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A single ad placement. Always reserves its height, whether or not an ad
 * ever fills it, so the page cannot shift under the reader.
 */
export function AdSlot({
  slot,
  label = "Advertisement",
  minHeight = 280,
}: {
  slot: string;
  label?: string;
  minHeight?: number;
}) {
  const consent = React.useContext(ConsentContext);
  const ref = React.useRef<HTMLModElement>(null);
  const pushed = React.useRef(false);

  React.useEffect(() => {
    if (consent !== "granted" || pushed.current || !ref.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle ?? [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // A blocked or failed ad must never break the calculator above it.
    }
  }, [consent]);

  if (!ADS_ENABLED) return null;

  return (
    <aside
      aria-label={label}
      className="my-12 flex flex-col items-center gap-2"
      style={{ minHeight }}
    >
      <span className="kicker">{label}</span>
      {consent === "granted" ? (
        <ins
          ref={ref}
          className="adsbygoogle block w-full"
          style={{ display: "block", minHeight: minHeight - 24 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-sm border border-dashed border-[var(--rule)] text-xs text-muted-foreground"
          style={{ minHeight: minHeight - 24 }}
        >
          {consent === "denied" ? "Ads turned off" : ""}
        </div>
      )}
    </aside>
  );
}
