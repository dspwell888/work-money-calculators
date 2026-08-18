# Work & Money Calculators

Static English-language calculator site. First page: `/salary-increase-calculator/`.

Built from `BUILD-BRIEF-work-money-tools-2026-08-05.md` in `~/agent/demand-radar/decisions/`.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui, exported as a fully
static site (`output: 'export'`). No backend, no database, no API routes, no AI models.
Every calculation runs in the visitor's browser.

Only `src/components/raise-calculator.tsx` is a client component. The page shell, copy,
FAQ, and structured data are server components so they land in the static HTML.

shadcn components in use: `input`, `label`, `select`, `tabs`, `button`. Panels, tables,
and stat blocks are purpose-built for the design below rather than pulled from the
registry.

## Design

Financial broadsheet. Warm paper ground, ink type, hairline rules instead of drop
shadows, Instrument Serif for display and IBM Plex Sans/Mono for UI and figures. Green
(`--gain`) is reserved for a raise and oxblood (`--loss`) for a cut; neither is ever
used decoratively. Money in columns uses the fixed two-decimal form so digits align;
headline figures drop the cents when there are none.

All tokens live in `src/app/globals.css`. Dark mode follows `prefers-color-scheme`;
there is no toggle.

## Commands

```bash
npm run dev      # localhost:3000
npm run build    # static export into ./out
npm run check    # tsc + eslint + tests — run this before shipping
npm test         # vitest
npx serve out    # preview the real static output (no -s flag: it breaks routing)
```

## Before publishing

`npm run build` prints a warning while any of these are unset, because without them
canonical URLs point at localhost and the privacy and contact pages name no operator —
which fails AdSense review:

```bash
NEXT_PUBLIC_SITE_URL=https://example.com     # canonical, OG, sitemap, robots
NEXT_PUBLIC_OPERATOR_NAME="Your Name Ltd"    # named on the legal pages
NEXT_PUBLIC_CONTACT_EMAIL=hi@example.com     # contact page + privacy requests
NEXT_PUBLIC_JURISDICTION="England and Wales" # governing law in the terms
```

Optional, both off by default:

```bash
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-…   # turns on ads AND the consent banner
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=…        # cookie-free analytics, needs no consent
```

With `NEXT_PUBLIC_ADSENSE_CLIENT` unset the build ships no ad markup and makes zero
third-party requests, and the privacy policy switches to its "no cookies at all"
wording automatically. Verified, not assumed.

## Advertising

`src/components/ads.tsx`. Two rules the layout enforces:

- **Nothing loads before consent.** The Google script is only injected after the visitor
  accepts; rejecting leaves the site third-party-free. The choice persists in
  localStorage and the calculators work identically either way.
- **No ad between the reader and their answer.** `AdSlot` sits below the calculator, the
  methods, and the essay. Every slot reserves its height whether or not it fills, so
  measured CLS stays at 0.

## Tests

`npm test` — 70 tests over the three math modules. They cover the worked examples
printed on each page, the edge cases (zero pay, zero-hour schedules, non-numeric input),
and the conversions that must round-trip. That last group exists because a shipped bug
turned 7:20 into 7.33 into 7:19; `time-decimal.test.ts` now checks every whole minute of
an hour survives the round trip.

There are no component tests. The UI is verified by driving a real browser.

## Domain

Not chosen yet. Nothing hardcodes a domain — canonical URLs, Open Graph URLs, the
sitemap, and robots.txt all read `NEXT_PUBLIC_SITE_URL`, falling back to
`http://localhost:3000`.

Set it at build time before the first real deploy:

```bash
NEXT_PUBLIC_SITE_URL=https://example.com npm run build
```

Pick an extensible site name. The page map already has six calculators and may grow to
a second cluster, so do not lock the domain to a single tool.

## Page map

| Path | Keywords / KD | Status |
|---|---|---|
| `/salary-increase-calculator/` | 53,600 · KD 18-26 | live |
| `/time-to-decimal-calculator/` | 21,290 · KD 15-28 | live |
| `/pro-rata-calculator/` | 2,900 · KD 22 | live |
| `/time-and-a-half-calculator/` | 9,900 · KD 34 | live |
| `/commission-calculator/` | 3,600 · KD 35 | live, **SERP advertiser check outstanding** |
| `/hourly-to-salary-calculator/` | 44,500 · KD 41-47 | live |

Every page cross-links to the other five, so P1 is a hub rather than an island.

`src/lib/site.ts` is the single source: adding an entry there puts a tool into the
homepage list, every page's "other calculators" block, and the sitemap. A `comingSoon`
flag renders it as plain text rather than a link, so there are never dead links.

### Outstanding gate on P5

The brief requires checking who buys ads on `commission calculator` before investing in
it: its CPC of $19.18 sits in the $10-30 grey zone. Sales CRM or compensation SaaS
advertisers mean the traffic is worth having; real-estate lead-gen advertisers mean that
price is a lead price a free tool page cannot capture, and the page should be
deprioritised. The page is built; the check is not done.

## Site map

Six calculators plus `/about/`, `/contact/`, `/privacy-policy/`, `/terms/`, and a custom
404. Every calculator page carries breadcrumbs, a BreadcrumbList + WebApplication +
FAQPage graph, and links to the other five. The footer links the legal pages from every
page on the site.

## Accessibility and performance

Audited, with numbers rather than assertions:

- Contrast: every text pair passes WCAG AA in both light and dark (lowest is 5.55:1,
  the 11px kicker on the page background).
- Every interactive control has an accessible name; every focusable element has a
  visible focus style; heading order has no skipped levels; there is a skip link.
- CLS 0.0000. Fonts are 74KB across 4 files on calculator pages, 20KB on prose pages —
  IBM Plex Mono is deliberately not preloaded because the prose pages never use it.

## Architecture

- `src/lib/*.ts` — pure math per domain, no React. Unit-testable, importable from server
  components.
- `src/components/calc-ui.tsx` — shared panels, ruled tables, inputs, copy buttons, and
  the `useUrlState` hook. This is what stops six calculators drifting into six designs.
- `src/components/tool-page.tsx` — the server-rendered page shell: masthead, methods,
  essay, FAQ, internal links, JSON-LD.
- `src/components/*-calculator.tsx` — one client component per tool. The only client
  code on any page.
- `scripts/fix-og.mjs` — postbuild. Next emits `opengraph-image` without a file
  extension, so static hosts serve it with no Content-Type and social crawlers reject
  it. This renames to `.png` and rewrites the references.

## Hard constraint: no tax calculation

This site must not calculate take-home pay from tax data. No tax tables, no withholding
rules, no state or country rates, no W-4 or 1099 logic. Those numbers change constantly
and getting one wrong costs a visitor real money.

The one permitted exception, already implemented on P1: a visitor may type their own
effective deduction rate, clearly labelled as a scenario estimate. It multiplies the
number they supplied. It looks nothing up.

The largest keywords in this niche are state paycheck calculators. They are deliberately
out of scope.

## What "done" looks like

Not page count or ship speed. The milestone is the first real Google Search Console
impression data, 4-8 weeks after the page is indexed. Until that arrives, do not expand
scope or change direction.
