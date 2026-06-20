"use client";

import { useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  loanAmountInr: number;
  annualSavingsInr: number;
}

export function EMICalculator({ loanAmountInr, annualSavingsInr }: Props) {
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [interestRate, setInterestRate] = useState<number>(8.5); // Default typical SBI Surya Ghar loan rate
  const [loanPercentage, setLoanPercentage] = useState<number>(80); // Default 80% financing

  const principal = (loanAmountInr * loanPercentage) / 100;
  const monthlyRate = interestRate / 12 / 100;
  const months = tenureYears * 12;

  // EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const emi =
    monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      : principal / months;

  const monthlySavings = annualSavingsInr / 12;
  const netMonthlyCashflow = monthlySavings - emi;
  const isCashflowPositive = netMonthlyCashflow > 0;

  return (
    <div className="glass-card p-8 rounded-3xl text-left border border-white/40 h-full flex flex-col justify-between">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs text-stone-450 uppercase tracking-wider font-semibold">Financial Planner</p>
          <h3 className="text-lg font-bold text-primary font-serif mt-1">Solar Loan EMI Calculator</h3>
          <p className="text-stone-500 text-xs mt-1 leading-normal font-medium">
            Calculate your monthly loan payments and compare them directly with your solar electricity savings.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Inputs */}
          <div className="flex flex-col gap-4">
            {/* Financing Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-stone-600">
                <span>Financing: {loanPercentage}%</span>
                <span className="font-bold text-primary">{formatCurrency(principal)}</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={loanPercentage}
                onChange={(e) => setLoanPercentage(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Interest Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-stone-600">
                <span>Interest: {interestRate}% p.a.</span>
                <span>SBI Surya Ghar: 8.5%</span>
              </div>
              <input
                type="range"
                min="7.0"
                max="12.0"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Tenure Buttons */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-stone-600">Loan Tenure</label>
              <div className="flex gap-2">
                {[3, 5, 7, 10].map((years) => (
                  <button
                    key={years}
                    onClick={() => setTenureYears(years)}
                    className="flex-1 py-2 rounded-[10px] text-xs font-bold transition-all duration-200 cursor-pointer border bg-white border-stone-200 text-stone-500 hover:text-stone-900"
                    style={{
                      background: tenureYears === years ? "#003527" : "white",
                      color: tenureYears === years ? "white" : "#57534e",
                    }}
                  >
                    {years} Yrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div
            className="p-5 rounded-2xl flex flex-col justify-between gap-4 border border-stone-200/50 bg-stone-50/50"
          >
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Estimated Monthly EMI</p>
              <p className="text-2xl font-extrabold text-primary font-serif mt-1">{formatCurrency(emi)}</p>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
                Principal: {formatCurrency(principal)} · {months} months
              </p>
            </div>

            <div className="border-t border-stone-200/50 pt-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-stone-400">Monthly Savings:</span>
                <span className="font-bold text-primary">{formatCurrency(monthlySavings)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-400">Monthly EMI:</span>
                <span className="font-bold text-red-500">-{formatCurrency(emi)}</span>
              </div>

              <div
                className={`mt-2 p-3 rounded-xl text-center font-bold border ${
                  isCashflowPositive ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-amber-50 text-amber-800 border-amber-100"
                }`}
              >
                {isCashflowPositive ? (
                  <>
                    <p className="text-xs">🌱 Cashflow Positive!</p>
                    <p className="text-[10px] mt-0.5 font-medium opacity-80">
                      Savings exceed EMI by <strong className="text-emerald-700">{formatCurrency(netMonthlyCashflow)}/mo</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs">💡 Net Cost: {formatCurrency(-netMonthlyCashflow)}/mo</p>
                    <p className="text-[10px] mt-0.5 font-medium opacity-80">EMI exceeds savings</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
