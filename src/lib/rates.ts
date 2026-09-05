/**
 * Retro pay, real-estate commission splits, freelance rates, and the true cost
 * of an employee. Pure functions.
 *
 * Every figure is gross. Where an employer-side charge is involved it is a
 * percentage the user types in — this file contains no tax rates and looks
 * nothing up.
 */

/* ---------------------------------------------------------------- */
/* Retro pay                                                         */
/* ---------------------------------------------------------------- */

export type RetroBasis = "hourly" | "salary";

export interface RetroInput {
  basis: RetroBasis;
  /** Rate before the change: per hour, or per year. */
  oldRate: number;
  newRate: number;
  /** Hourly basis: hours worked in the retro period. */
  hours: number;
  /** Salary basis: how many pay periods were underpaid, and how many a year. */
  periods: number;
  periodsPerYear: number;
}

export interface RetroResult {
  /** Difference per hour, or per pay period. */
  differencePerUnit: number;
  /** How many units the difference applies to. */
  units: number;
  unitLabel: string;
  backPay: number;
  /** Percentage the rate went up by. */
  increasePercent: number;
}

export function computeRetroPay(i: RetroInput): RetroResult {
  if (i.basis === "hourly") {
    const differencePerUnit = i.newRate - i.oldRate;
    return {
      differencePerUnit,
      units: i.hours,
      unitLabel: "hours",
      backPay: differencePerUnit * i.hours,
      increasePercent:
        i.oldRate === 0 ? 0 : (differencePerUnit / i.oldRate) * 100,
    };
  }

  // Salary basis: convert both annual figures to per-period pay, then multiply
  // by the number of periods that were paid at the old rate.
  const perYear = i.periodsPerYear > 0 ? i.periodsPerYear : 26;
  const differencePerUnit = (i.newRate - i.oldRate) / perYear;
  return {
    differencePerUnit,
    units: i.periods,
    unitLabel: "pay periods",
    backPay: differencePerUnit * i.periods,
    increasePercent:
      i.oldRate === 0 ? 0 : ((i.newRate - i.oldRate) / i.oldRate) * 100,
  };
}

/* ---------------------------------------------------------------- */
/* Real-estate commission                                            */
/* ---------------------------------------------------------------- */

/**
 * Split order, decided deliberately and worth checking in review:
 *
 *   sale price × total rate  →  total commission
 *   total commission         →  listing side / buying side
 *   each side                →  that side's agent / that side's brokerage
 *
 * This is the order the money actually moves: the total is split between the
 * two sides first, and each brokerage then splits its own side with its own
 * agent. Applying a brokerage split to the whole commission instead would
 * quietly assume both sides share one brokerage.
 */
export interface CommissionSplitInput {
  salePrice: number;
  /** Total commission rate, percent of sale price. */
  totalRatePercent: number;
  /** Share of the total going to the listing side, percent. */
  listingSharePercent: number;
  /** Share each side's agent keeps from their own side, percent. */
  listingAgentSplitPercent: number;
  buyingAgentSplitPercent: number;
}

export interface CommissionSplitResult {
  totalCommission: number;
  listingSide: number;
  buyingSide: number;
  listingAgent: number;
  listingBrokerage: number;
  buyingAgent: number;
  buyingBrokerage: number;
  /** What the seller nets before any other cost. */
  netToSeller: number;
  /** Total commission as a share of the sale price. */
  effectiveRate: number;
}

export function computeCommissionSplit(
  i: CommissionSplitInput,
): CommissionSplitResult {
  const totalCommission = (i.salePrice * i.totalRatePercent) / 100;
  const listingSide = (totalCommission * i.listingSharePercent) / 100;
  const buyingSide = totalCommission - listingSide;

  const listingAgent = (listingSide * i.listingAgentSplitPercent) / 100;
  const buyingAgent = (buyingSide * i.buyingAgentSplitPercent) / 100;

  return {
    totalCommission,
    listingSide,
    buyingSide,
    listingAgent,
    listingBrokerage: listingSide - listingAgent,
    buyingAgent,
    buyingBrokerage: buyingSide - buyingAgent,
    netToSeller: i.salePrice - totalCommission,
    effectiveRate:
      i.salePrice === 0 ? 0 : (totalCommission / i.salePrice) * 100,
  };
}

/* ---------------------------------------------------------------- */
/* Freelance rate                                                    */
/* ---------------------------------------------------------------- */

export interface FreelanceInput {
  /** What you want to earn for yourself in a year. */
  targetIncome: number;
  /** Business costs for the year: software, insurance, equipment. */
  annualCosts: number;
  /** Profit as a percentage of billed revenue. */
  profitMarginPercent: number;
  /** Working days a year before subtracting non-billable time. */
  workingDays: number;
  /** Share of working days that are actually billable. */
  utilisationPercent: number;
  hoursPerDay: number;
}

export interface FreelanceResult {
  requiredRevenue: number;
  billableDays: number;
  billableHours: number;
  dayRate: number;
  hourlyRate: number;
  /** The rate someone would need as an employee to match, ignoring benefits. */
  nonBillableDays: number;
}

export function computeFreelanceRate(i: FreelanceInput): FreelanceResult {
  const beforeMargin = i.targetIncome + i.annualCosts;
  const marginRate = i.profitMarginPercent / 100;
  // Margin is profit / revenue, not a markup on costs. At a 20% margin,
  // $90,000 of income and costs therefore needs $112,500 of revenue:
  // ($112,500 - $90,000) / $112,500 = 20%.
  const requiredRevenue =
    marginRate < 1 ? beforeMargin / (1 - marginRate) : Number.POSITIVE_INFINITY;

  const billableDays = i.workingDays * (i.utilisationPercent / 100);
  const billableHours = billableDays * i.hoursPerDay;

  return {
    requiredRevenue,
    billableDays,
    billableHours,
    dayRate: billableDays > 0 ? requiredRevenue / billableDays : 0,
    hourlyRate: billableHours > 0 ? requiredRevenue / billableHours : 0,
    nonBillableDays: i.workingDays - billableDays,
  };
}

/* ---------------------------------------------------------------- */
/* True cost of an employee                                          */
/* ---------------------------------------------------------------- */

export interface BenefitLine {
  id: string;
  name: string;
  /** Annual cost to the employer. */
  amount: number;
}

export interface EmployeeCostInput {
  baseSalary: number;
  /**
   * Employer-side charges as a single percentage of base salary, typed in by
   * the user. This file deliberately contains no tax rates: what an employer
   * owes varies by country, by headcount, and by year.
   */
  employerChargesPercent: number;
  benefits: BenefitLine[];
  /** One-off first-year costs: recruitment, equipment, onboarding. */
  oneOffCosts: number;
  /** Used to express the total as a cost per productive hour. */
  productiveHoursPerYear: number;
}

export interface EmployeeCostResult {
  baseSalary: number;
  employerCharges: number;
  benefitsTotal: number;
  oneOffCosts: number;
  /** Everything that recurs each year. */
  recurringTotal: number;
  /** Recurring plus the one-off costs. */
  firstYearTotal: number;
  /** Recurring cost as a multiple of base salary. */
  multiple: number;
  costPerHour: number;
  /** Cost above the salary itself. */
  overhead: number;
}

export function computeEmployeeCost(
  i: EmployeeCostInput,
): EmployeeCostResult {
  const employerCharges = (i.baseSalary * i.employerChargesPercent) / 100;
  const benefitsTotal = i.benefits.reduce((s, b) => s + b.amount, 0);
  const recurringTotal = i.baseSalary + employerCharges + benefitsTotal;

  return {
    baseSalary: i.baseSalary,
    employerCharges,
    benefitsTotal,
    oneOffCosts: i.oneOffCosts,
    recurringTotal,
    firstYearTotal: recurringTotal + i.oneOffCosts,
    multiple: i.baseSalary > 0 ? recurringTotal / i.baseSalary : 0,
    costPerHour:
      i.productiveHoursPerYear > 0
        ? recurringTotal / i.productiveHoursPerYear
        : 0,
    overhead: recurringTotal - i.baseSalary,
  };
}
