"use client";

import { cn } from "@/lib/utils/format";
import { forwardRef } from "react";

interface ClayInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export const ClayInput = forwardRef<HTMLInputElement, ClayInputProps>(
  ({ label, error, hint, prefix, suffix, icon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.04em] block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 flex items-center justify-center">
              {icon}
            </span>
          )}
          {prefix && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input w-full placeholder-gray-400",
              "text-sm transition-all duration-150",
              icon ? "pl-10" : "",
              prefix ? "pl-8" : "",
              suffix ? "pr-12" : "",
              error && "border-red-400 focus:border-red-500 focus:ring-red-400/20",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);

ClayInput.displayName = "ClayInput";
