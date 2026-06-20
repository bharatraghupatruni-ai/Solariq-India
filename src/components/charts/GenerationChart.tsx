"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { ClayCard } from "@/components/ui/ClayCard";
import { MONTHS } from "@/lib/utils/format";

interface GenerationChartProps {
  monthlyBreakdown: number[];
  yearlyProjections: number[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="clay-card-sm p-3 text-sm">
      <p className="font-semibold text-[#1a2332] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value.toFixed(0)} kWh</strong>
        </p>
      ))}
    </div>
  );
};

export function MonthlyGenerationChart({ monthlyBreakdown }: { monthlyBreakdown: number[] }) {
  const data = MONTHS.map((month, i) => ({
    month,
    generation: Math.round(monthlyBreakdown[i] ?? 0),
  }));

  return (
    <ClayCard>
      <h3 className="font-semibold text-[#1a2332] mb-4">Monthly Generation Forecast</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#9ba4b0", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ba4b0", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="generation"
            name="Generation"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ClayCard>
  );
}

export function GenerationProjectionChart({
  yearlyProjections,
}: {
  yearlyProjections: number[];
}) {
  const data = yearlyProjections.map((kwh, i) => ({
    year: `Y${i + 1}`,
    generation: Math.round(kwh),
  }));

  return (
    <ClayCard>
      <h3 className="font-semibold text-[#1a2332] mb-4">25-Year Generation Forecast</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="genGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            tick={{ fill: "#9ba4b0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: "#9ba4b0", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="generation"
            name="Generation"
            stroke="#f59e0b"
            strokeWidth={2.5}
            fill="url(#genGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ClayCard>
  );
}
