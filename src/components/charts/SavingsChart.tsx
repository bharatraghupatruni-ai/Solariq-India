"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ClayCard } from "@/components/ui/ClayCard";
import { formatCurrency } from "@/lib/utils/format";

interface SavingsChartProps {
  yearwiseCumulativeSavings: number[];
  netInvestment: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const isPositive = value >= 0;
  return (
    <div className="clay-card-sm p-3 text-sm">
      <p className="font-semibold text-[#1a2332] mb-1">Year {label}</p>
      <p style={{ color: isPositive ? "#10b981" : "#ef4444" }}>
        Net Position: <strong>{formatCurrency(value, { compact: true })}</strong>
      </p>
    </div>
  );
};

export function SavingsChart({
  yearwiseCumulativeSavings,
  netInvestment,
}: SavingsChartProps) {
  const data = yearwiseCumulativeSavings.map((saving, i) => ({
    year: i + 1,
    net: Math.round(saving),
  }));

  const breakEvenYear = data.findIndex((d) => d.net >= 0) + 1;

  return (
    <ClayCard glow={breakEvenYear > 0 ? "eco" : "none"}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-[#1a2332]">Cumulative Savings Over 25 Years</h3>
        {breakEvenYear > 0 && (
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">
            Break-even Year {breakEvenYear}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="negativeGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            tick={{ fill: "#9ba4b0", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `Y${v}`}
            interval={4}
          />
          <YAxis
            tick={{ fill: "#9ba4b0", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v, { compact: true })}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#9ba4b0" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="net"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#positiveGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ClayCard>
  );
}
