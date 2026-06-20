/**
 * EMI Calculator
 * Solar loan EMI, total interest, break-even with loan
 *
 * Banks offering solar loans in India:
 * - SBI Solar Loan: 7-9% interest, up to ₹10L
 * - HDFC: 9-11%
 * - IREDA: 8.5-9.5%
 */

export interface EMIInput {
  loanAmountInr: number;
  interestRatePct: number;
  tenureYears: number;
  annualSavingsInr: number;
}

export interface EMIResult {
  emiInr: number;
  totalInterestInr: number;
  totalAmountPaidInr: number;
  breakEvenWithLoanYears: number;
  monthlyCashflowPositive: boolean;
  netBenefitVsCash: number;
  monthwiseBreakdown: Array<{
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

export function calculateEMI(input: EMIInput): EMIResult {
  const { loanAmountInr, interestRatePct, tenureYears, annualSavingsInr } = input;
  const monthlyRate = interestRatePct / 100 / 12;
  const totalMonths = tenureYears * 12;
  const monthlySavings = annualSavingsInr / 12;

  // EMI formula: P × r × (1+r)^n / ((1+r)^n - 1)
  let emiInr: number;
  if (monthlyRate === 0) {
    emiInr = loanAmountInr / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    emiInr = loanAmountInr * monthlyRate * factor / (factor - 1);
  }

  const totalAmountPaidInr = emiInr * totalMonths;
  const totalInterestInr = totalAmountPaidInr - loanAmountInr;

  // Month-wise amortization
  const monthwiseBreakdown: EMIResult["monthwiseBreakdown"] = [];
  let balance = loanAmountInr;
  for (let month = 1; month <= totalMonths; month++) {
    const interest = balance * monthlyRate;
    const principal = emiInr - interest;
    balance = Math.max(0, balance - principal);
    monthwiseBreakdown.push({
      month,
      emi: Math.round(emiInr),
      principal: Math.round(principal),
      interest: Math.round(interest),
      balance: Math.round(balance),
    });
  }

  // Break-even with loan: find when cumulative savings exceed cumulative EMI outflow
  const monthlyCashflowPositive = emiInr < monthlySavings;

  let cumulativeSavings = 0;
  let cumulativeEmi = 0;
  let breakEvenWithLoanYears = 0;
  for (let month = 1; month <= 360; month++) {
    const yearFraction = (month - 1) / 12;
    const inflationBoost = Math.pow(1.06, yearFraction);
    cumulativeSavings += monthlySavings * inflationBoost;
    if (month <= totalMonths) {
      cumulativeEmi += emiInr;
    }
    if (cumulativeSavings >= cumulativeEmi) {
      breakEvenWithLoanYears = month / 12;
      break;
    }
  }

  // Net benefit vs cash purchase:
  // Cash: invest full amount, get savings from day 1
  // Loan: pay EMI, savings offset EMI, difference invested elsewhere
  // Simplified: compare total savings - total EMI over tenure vs annualSavings * tenure
  const netBenefitVsCash = (annualSavingsInr * tenureYears) - totalAmountPaidInr;

  return {
    emiInr: Math.round(emiInr),
    totalInterestInr: Math.round(totalInterestInr),
    totalAmountPaidInr: Math.round(totalAmountPaidInr),
    breakEvenWithLoanYears: Math.round(breakEvenWithLoanYears * 10) / 10,
    monthlyCashflowPositive,
    netBenefitVsCash: Math.round(netBenefitVsCash),
    monthwiseBreakdown,
  };
}

// Preset solar loan options in India
export const SOLAR_LOAN_PRESETS = [
  { label: "SBI Solar Loan", interestRate: 8.5, maxAmount: 1000000, tenureYears: [5, 7, 10] },
  { label: "HDFC Green Loan", interestRate: 9.5, maxAmount: 3000000, tenureYears: [5, 7, 10, 15] },
  { label: "IREDA Govt Loan", interestRate: 9.0, maxAmount: 5000000, tenureYears: [7, 10, 15] },
  { label: "Axis Green Loan", interestRate: 10.0, maxAmount: 2000000, tenureYears: [5, 7, 10] },
];
