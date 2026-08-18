# Calculation conventions

Every modelling decision on this site that a reviewer could reasonably disagree
with, why it was made, and the test that pins it.

Read this before changing anything in `src/lib/`. If you change a convention,
change the test in the same commit — a convention with no failing test when you
break it is not a convention, it is an accident.

**Scope note.** Everything on this site is **gross**. No page applies a tax
rate, a withholding rule, or a rate table of any kind. Where a page shows a
figure net of anything, the percentage came from the visitor. This is a
deliberate product constraint, not an omission — see `README.md`.

---

## 1. Pay period conversion — `salary.ts`

**Convention.** Every pay figure is normalised through *annual* before anything
is compared. A pay period is only a lens onto the same annual number.

**Why.** An hourly increase and an annual increase are not comparable until
they sit on the same basis. Converting through annual once, centrally, means no
two pages can disagree about what "$2 an hour" is worth.

**Consequence worth knowing.** `monthly` uses 12 regardless of `weeksPerYear`,
while `weekly` and `biweekly` scale with it. That is intentional — months are
not weeks — but it means a 48-week year gives `annual/12` for monthly and
`annual/48` for weekly, which is correct and occasionally surprising.

**Pinned by.** `salary.test.ts` → "round-trips every period through annual",
"honours a non-standard schedule".

---

## 2. Zero-guards return 0, never Infinity — everywhere

**Convention.** Division by a zero denominator returns `0`, not `Infinity` or
`NaN`. Blank and unparseable numeric input is `0`.

**Why.** A calculator that renders `NaN` or `$Infinity` looks broken and
destroys trust in every other figure on the page. Zero is visibly wrong in a
way the user can diagnose.

**Exception.** `computeRaise` returns `percent: 0` on zero current pay, because
"infinite percentage raise" is meaningless rather than merely large.

**Pinned by.** Every `*.test.ts` has an "edge cases" or "does not divide by
zero" block.

---

## 3. Headline figures drop the cents, columns keep them — `salary.ts`

**Convention.** `formatMoneyDisplay` omits `.00` when there are no cents;
`formatCurrency` always shows two decimals.

**Why.** `$63,000.00` reads as a receipt, `$63,000` reads as a salary. But a
column of money must align digit for digit, so tables keep the fixed form.

**Pinned by.** `salary.test.ts` → "drops the cents from headline figures only
when there are none".

---

## 4. Time → decimal must round-trip — `time-decimal.ts`

**Convention.** When a decimal figure is displayed as a clock time without
seconds, it rounds to the nearest minute (`fromDecimalToMinute`), not down.
`fromDecimal` stays exact and keeps seconds.

**Why.** This shipped as a bug. 7:20 converts to 7.33; truncating 7.33 back
gave **7:19**. A converter whose round trip does not close is a converter
nobody should trust.

**Pinned by.** `time-decimal.test.ts` → "round-trips every whole minute of an
hour" (60 assertions), "7:20 → 7.33 → 7:20".

---

## 5. Payroll rounding is per entry, then summed — `time-decimal.ts`

**Convention.** Each timesheet row is rounded to the increment first; the total
is the sum of rounded rows.

**Why.** That is the order payroll systems use. Rounding the total instead
gives a different, usually lower, number — and the whole point of the page is
to reproduce what the payslip will say.

**Pinned by.** `time-decimal.test.ts` → "sums a rounded timesheet the way
payroll does".

---

## 6. Billable time always rounds **up** — `billing.ts`

**Convention.** `roundUpMinutes` uses `Math.ceil`. Any part of an increment
bills a whole increment. Rounding is per entry, never on the total.

**Why.** This is the defining rule of billable hours and the reason the page
exists. Nearest-rounding would make it a timesheet.

**Also.** Minutes are summed as integers before converting to hours. Summing
fractional hours per line accumulated float error — a 2-hour sheet reported
`1.9999999999999998` and an uplift of `-2e-16`.

**Pinned by.** `billing.test.ts` → "always up, never nearest", "rounds each line
up before totalling", "charges actual minutes on the 1-minute increment".

---

## 7. Per-child uplift raises the base rate before overtime — `billing.ts`

**Convention.** In `computeNannyPay`, the extra-child uplift is added to the
hourly rate, and the overtime multiplier is applied to that uplifted rate.

**Why.** Overtime multiplies the rate actually being worked. A sitter on $22
because there are two children earns $33 at time and a half, not $30.

**Pinned by.** `billing.test.ts` → "applies overtime to the uplifted rate, not
the headline rate".

---

## 8. PTO accrues in completed periods only — `pto.ts`

**Convention.** Partial periods credit nothing. A fortnightly accrual lands on
day 14, not gradually.

**Why.** It is how employers actually credit it. Spreading accrual evenly would
run ahead of the real balance for most of every period, and the balance is the
number people book holiday against.

**Semimonthly threshold.** The mid-month credit lands at **14 days** past the
month anniversary, not a true half-month. Semimonthly payroll conventionally
pays on the 15th and the last day, so someone starting on the 1st is credited
on the 15th. This was wrong on first write (15 days) and the test caught it.

**Pinned by.** `pto.test.ts` → "counts only completed periods", "credits twice a
month on a semimonthly schedule".

---

## 9. A PTO cap limits the balance, not the annual earn — `pto.ts`

**Convention.** Carryover is added *before* the cap. Anything above the cap is
reported as `forfeited` on its own line rather than silently dropped.

**Why.** A cap is a ceiling on what you can hold. Once you touch it, further
accrual is lost — quietly, with no notification. Surfacing the forfeited figure
is the main reason to use the page.

**Pinned by.** `pto.test.ts` → "applies a cap and reports what was forfeited".

---

## 10. Time card: an out time at or before the in time crosses midnight — `timecard.ts`

**Convention.** `end <= start` means the shift ends the next day. 22:00 → 06:00
is 8 hours. Equal times mean a full 24 hours. Affected rows are marked with a
moon icon in the UI.

**Why.** There is no way to distinguish a night shift from a typo, and on a time
card the night shift is overwhelmingly more likely. The alternative — a negative
day — is never right.

**Pinned by.** `timecard.test.ts` → "cross-midnight — documented decision 1".

---

## 11. Time card: overtime is weekly, never per card — `timecard.ts`

**Convention.** Rows are grouped into weeks and the overtime threshold is
applied to each week separately. A biweekly card is two weeks.

**Why.** 50 hours then 30 is **ten hours of overtime**, not zero. Averaging
across the card would understate what is owed, and understating what is owed is
the specific error this page exists to prevent.

**Week boundary.** Configurable, Sunday or Monday. It decides which week a
weekend shift falls in, and can move a week over or under the threshold.

**Pinned by.** `timecard.test.ts` → "charges overtime in the heavy week even
though the card averages 40", "moves hours between weeks when the week start
changes".

---

## 12. Time card: a break longer than the shift clamps to zero — `timecard.ts`

**Convention.** Worked minutes never go negative; the row is flagged
`breakTooLong`.

**Why.** It is almost always an am/pm typo. Flagging is more useful than
subtracting from the week.

**Pinned by.** `timecard.test.ts` → "clamps at zero and flags a break longer
than the shift".

---

## 13. Commission is marginal, band by band — `work-math.ts`

**Convention.** Each slice of sales earns the rate of the band it falls in.
Reaching an 8% tier does **not** pay 8% on everything.

**Why.** It is how commission plans are normally written, and the same shape as
a progressive tax band. The alternative (top rate on the whole amount) is a
cliff and is rare.

**Pinned by.** `work-math.test.ts` → "pays each band at its own rate, not the
top rate on everything", which asserts the wrong answer is *not* produced.

---

## 14. Real estate: split total → sides → agent/brokerage, in that order — `rates.ts`

**Convention.** Sale price × total rate gives the total. The total splits
between listing and buying side. *Then* each side splits with its own
brokerage. An agent's percentage is a share of **their side**, never of the
whole commission.

**Why.** It is the order the money actually moves. Applying a brokerage split to
the whole commission would assume both sides share one brokerage, and roughly
doubles what an agent appears to receive — $15,000 instead of $7,500 on a
$500k sale at 5%.

**Pinned by.** `rates.test.ts` → "applies the brokerage split to one side only,
never to the total", "every part adds back to the total".

---

## 15. Freelance rate divides by billable hours, not working hours — `rates.ts`

**Convention.** `billableDays = workingDays × utilisation`. The rate is required
revenue divided by billable hours.

**Why.** Dividing a target income by 2,080 assumes every working hour is
billable. Non-billable days do not disappear — they are paid for out of the
billable ones, which roughly doubles the honest rate.

**Pinned by.** `rates.test.ts` → "raises the rate as utilisation falls",
"reports the non-billable days that the rate has to absorb".

---

## 16. Employee cost: recurring and first-year are separate numbers — `rates.ts`

**Convention.** One-off costs (recruitment, equipment, onboarding) are excluded
from `recurringTotal` and included in `firstYearTotal`. The multiple is computed
on the recurring figure.

**Why.** They are used at different moments: first-year to approve a hire,
recurring to budget every year after. Merging them permanently inflates a team's
cost line.

**Employer charges are a user-supplied percentage.** No rate is built in,
because employer-side charges differ by country, headcount, and year.

**Pinned by.** `rates.test.ts` → "separates first-year one-off costs from the
recurring total", "uses only the percentage it is given — no built-in rates".

---

## 17. Retro pay: salary basis counts pay periods, not weeks — `rates.ts`

**Convention.** On the salary basis, both annual figures convert to per-period
pay, then multiply by the number of periods paid short. A rate cut returns a
negative figure rather than being clamped.

**Why.** Payslips are the unit of evidence in a retro pay dispute. Counting
weeks invites an argument about which weeks; counting payslips does not.

**Pinned by.** `rates.test.ts` → "pays the per-period difference for each
underpaid period", "returns a negative figure rather than hiding a rate cut".

---

## 18. No external data is embedded anywhere — `comp.ts`

**Convention.** Salary survey figures, CPI/inflation rates, and prevailing wage
determinations are all **inputs**, never constants. `comp.ts` contains no
market data, no index series, and no government rate table.

**Why.** All three go stale annually and silently, all three are
jurisdiction-specific so any single figure is wrong for most visitors, and
being wrong about someone's pay costs them money. This is the same rule that
keeps tax calculation off the entire site.

**Where it shows in the UI.** Each of the three pages states it in a panel, not
in fine print — the visitor is told the tool does not know their market.

**Pinned by.** Not a unit test — an absence cannot be asserted. Audit by
grepping `src/lib/` for hardcoded rates. If a future change adds a default CPI
value or a wage table, this convention has been broken.

---

## 19. Percentile uses the mid-rank definition — `comp.ts`

**Convention.** Percentile rank = (count strictly below + half the count equal)
÷ total.

**Why.** It is symmetric. Counting only "strictly below" reports the lowest
member of a set as 0 and, with ties, produces an asymmetry where identical
salaries get different ranks depending on sort order.

**Pinned by.** `comp.test.ts` → "uses the mid-rank definition", "halves ties
rather than favouring one side".

---

## 20. A salary outside the surveyed range is clamped, never extrapolated — `comp.ts`

**Convention.** Above the top breakpoint or below the bottom, the percentile
returns that breakpoint's value with `clamped: true`. Between breakpoints it
interpolates linearly.

**Why.** A survey that stops at p90 says nothing whatsoever about p97.
Extrapolating would invent the most misleading number the page could produce.
The UI surfaces the clamp rather than hiding it.

**Known limit, stated on the page.** Linear interpolation between breakpoints is
an approximation — real salary distributions bunch near the median and stretch
at the top.

**Pinned by.** `comp.test.ts` → "clamps above the top breakpoint rather than
extrapolating", "does not flag a salary sitting exactly on an end breakpoint".

---

## 21. Inflation compounds — `comp.ts`

**Convention.** The price factor is `(1 + rate)^years`, not `1 + rate × years`.
Real figures are expressed in **starting-year** money (`end / factor`).

**Why.** Five years at 3% is 15.93%, not 15%; ten years is 34.4%, not 30%. The
linear estimate is wrong in the same direction every time and the error grows
with the period.

**Caught in review.** The first version of the test asserted that 60k → 70k over
five years at 3% was a real-terms *loss*. It is a small real gain — 16.67%
nominal against 15.93% cumulative. The code was right and the test expectation
was wrong; both a losing case and a winning case are now asserted.

**Pinned by.** `comp.test.ts` → "reports cumulative inflation over the period",
"gives zero real change when pay exactly tracks inflation", and the sign
agreement between `shortfall` and `realChange`.

---

## 22. Prevailing wage: overtime multiplies the base rate only — `comp.ts`

**Convention.** Overtime pay is `base × multiplier × otHours`. The fringe rate
is owed at **straight time for every hour worked, overtime hours included**, and
is never multiplied. The benefit credit is capped at the fringe rate.

**Why.** These are the two errors that appear on certified payroll. Multiplying
base + fringe overstates what is due; dropping fringe from overtime hours
underpays. Keeping them on separate lines means neither can hide inside a total.

**Pinned by.** `comp.test.ts` → "applies the overtime multiplier to the base
rate only" (asserts the wrong answer is *not* produced), "owes fringe at
straight time on overtime hours too", "never owes negative cash when benefits
exceed the fringe rate".

---

## 23. Duration sums may go negative — `time-decimal.ts`

**Convention.** `sumSignedDurations` does not clamp at zero. `clockDifference`
uses the same cross-midnight rule as the time card (§10).

**Why.** Subtracting a longer duration is a normal thing to want — working out
how far short of a target you are. Clamping would hide a real answer.

**Pinned by.** `time-decimal.test.ts` → "allows a negative total rather than
clamping it", "crosses midnight, matching the time card convention".

---

## 24. Roster weeks run from the schedule start date — `schedule.ts`

**Convention.** `computeSchedule` splits the roster into seven-day blocks
counted from the start date, and applies the overtime threshold to each block.
It does **not** use calendar weeks.

**Why.** A roster is built around the employer's workweek, which is not always
the calendar's. Counting from the start date means the user controls the
boundary by setting the start date — stated on the page as "set this to your
workweek start". It is the same weekly-not-per-period rule as §11.

**What it catches.** 67.5 hours split 45/22.5 costs more than the same 67.5
split evenly, because the first week breaches the threshold. Verified in the
browser: $1,400 against $1,350 on a $20 rate.

**Pinned by.** `schedule.test.ts` → "counts weeks in blocks of seven from the
start date, not the calendar", "charges overtime past the weekly threshold".

---

## 25. Deleting a shift template clears its assignments — `work-schedule-maker.tsx`

**Convention.** Removing a shift from the library rewrites every cell holding
that code to `OFF`.

**Why.** An orphaned code would render as an empty cell but keep occupying a
day, and the hours it contributed would silently vanish from the total with no
visible cause. Falling back to a day off is wrong in a way the user can see and
fix.

**Note.** This is UI state, not library logic, so the enforcing check is the
`computeSchedule` behaviour that an unknown code contributes zero — which is
the safety net if the rewrite is ever missed.

**Pinned by.** `schedule.test.ts` → "ignores a code with no matching template".

---

## 26. Real raise uses the exact form, not the subtraction — `salary.ts`

**Convention.** `computeRealRaise` returns `(1 + r) / (1 + i) − 1` as
`realPercent`. The familiar `r − i` shortcut is returned separately as
`approxPercent` and labelled "rule of thumb" in the UI.

**Why this and not the subtraction**, which is what the build brief specified:

1. **The money figure forces it.** The purchasing-power number is the new
   salary deflated by prices (`new / (1 + i)`) minus the old salary. Expressed
   against the old salary, that *is* the exact percentage. Showing a subtracted
   percentage next to an exactly-deflated amount would put two disagreeing
   numbers in the same panel.
2. **Cross-tool consistency.** `/wage-inflation-calculator/` already compounds
   properly (§21). An approximation on `/salary-increase-calculator/` would
   make two pages on the same site give different answers to the same question.

**The gap is small then large.** 3% against 4%: exact −0.96%, shortcut −1%.
20% against 10%: exact 9.09%, shortcut 10% — nearly a full point. Both are
shown so the reader can see which they are being given.

**Guard.** A price factor of zero or below falls back to "prices did not move"
rather than dividing by zero or flipping the sign.

**Pinned by.** `salary.test.ts` → "agrees with the wage inflation calculator
over one year" (asserts four fields match across the two modules), "diverges
from the rule of thumb as rates grow", "keeps the money figure and the
percentage consistent".

---

## 27. The inflation default is a placeholder, and says so — `salary.ts`

**Convention.** `DEFAULT_INFLATION_PERCENT = 3` seeds the field. It is
user-editable, nothing is fetched, and the UI states in bold that the figure is
a placeholder rather than a published statistic.

**Why.** Same rule as §18: inflation differs by country, gets revised after
publication, and a number baked in here would be wrong for most visitors and
stale within a year. A default is still needed so the panel shows something on
first load — the fix is labelling it honestly, not removing it.

**Audit by.** Reading the panel copy. If a future change presents the default
as an official rate, or adds a fetch, this convention has been broken.

---

## 28. Authorship claims only what is true — `legal.ts`

**Convention.** `AUTHORSHIP` names the operator, states the role plainly, and
carries an explicit `standing` line saying **no financial, tax, or legal
qualification is claimed**. No `Person` node is emitted in structured data and
no reviewer or credential is invented.

**Why.** The site is about money, where search quality guidance rewards visible
authorship — but a fabricated qualification is worse than none, and would be
trivially disprovable. What is actually claimed is a process: named operator,
working contact address, visible dates, stated formulas, and a test suite. That
is defensible; "reviewed by a certified financial planner" would not be.

**Where it shows.** A byline and a last-updated date on every calculator page,
`author` + `publisher` + `dateModified` on the WebApplication and FAQPage
nodes, a one-line disclaimer under every calculator, and the `/about/` page.

**Dates are maintained by hand** (`SITE_UPDATED`, with a per-tool override) and
not taken from the build clock, so a CSS tweak cannot claim that twenty
calculators were reviewed that day.

---

## How to audit this

```bash
npm run check     # tsc + eslint + all unit tests
npm test          # tests alone
```

Each convention above names the test that enforces it. To verify a convention
is real rather than documented, break it in `src/lib/` and confirm the named
test fails.
