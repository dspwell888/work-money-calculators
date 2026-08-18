import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

import { AdsProvider } from "@/components/ads";
import { PLAUSIBLE_DOMAIN } from "@/lib/legal";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Display face for headings and hero figures — high contrast, editorial.
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// UI and body. Plex has genuine character and excellent tabular figures.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  // 600 is unused; loading it only costs a preload nobody consumes.
  weight: ["400", "500"],
  display: "swap",
});

// Reserved for money in columns. Not preloaded: the prose pages never use it,
// and preloading it there earns a "preloaded but not used" penalty. The metric
// fallback keeps the swap from shifting layout on the calculator pages.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free Pay and Time Calculators`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free, no-signup calculators for pay, raises, and working time. Everything runs in your browser.",
  applicationName: SITE_NAME,
};

const FOOTER_LINKS = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/privacy-policy/", label: "Privacy" },
  { href: "/terms/", label: "Terms" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/opengraph-image.png`,
  };

  return (
    <html
      lang="en"
      className={`${display.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        <a
          href="#main"
          className="sr-only rounded-sm bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>

        <AdsProvider>
          <header className="rule-b">
            <div className="mx-auto flex w-full max-w-5xl items-baseline justify-between gap-4 px-5 py-4 sm:px-8">
              <Link
                href="/"
                className="font-heading text-lg leading-none transition-opacity hover:opacity-70"
              >
                Work<span className="text-muted-foreground"> &amp; </span>Money
              </Link>
              <span className="kicker hidden sm:block">Calculators</span>
            </div>
          </header>

          <main id="main" className="flex-1">
            {children}
          </main>

          <footer className="rule-t mt-20">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 text-sm sm:px-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <p className="max-w-sm leading-relaxed text-muted-foreground">
                  Every calculator here runs entirely in your browser. No
                  account, no data sent anywhere, nothing stored.
                </p>
                <p className="max-w-sm leading-relaxed text-muted-foreground sm:justify-self-end">
                  Results are for general information only and are not
                  financial, tax, or legal advice.
                </p>
              </div>
              <nav
                aria-label="Site information"
                className="rule-t flex flex-wrap gap-x-6 gap-y-2 pt-6"
              >
                {FOOTER_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {l.label}
                  </Link>
                ))}
                <span className="ml-auto text-muted-foreground">
                  © {new Date().getFullYear()} {SITE_NAME}
                </span>
              </nav>
            </div>
          </footer>
        </AdsProvider>

        {PLAUSIBLE_DOMAIN && (
          // Cookie-free and does not track across sites, so it needs no gate.
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
