export function formatCurrency(
  value: number,
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = false, decimals = 0 } = options;

  if (compact) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(
  value: number,
  options: { decimals?: number; compact?: boolean } = {}
): string {
  const { decimals = 1, compact = false } = options;
  if (compact) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(decimals)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(decimals)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatKwh(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(2)} MWh`;
  return `${value.toFixed(2)} kWh`;
}

export function formatKwp(value: number): string {
  return `${value.toFixed(2)} kWp`;
}

export function formatYears(value: number): string {
  const years = Math.floor(value);
  const months = Math.round((value - years) * 12);
  if (months === 0) return `${years} yrs`;
  return `${years} yrs ${months} mo`;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
