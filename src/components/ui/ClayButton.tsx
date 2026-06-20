import { cn } from "@/lib/utils/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function ClayButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = "button",
  ...props
}: ClayButtonProps) {
  const variantClasses: Record<Variant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "bg-transparent text-gray-600 hover:text-gray-950 hover:bg-gray-100/60 rounded-[10px]",
    danger: "bg-red-500 text-white font-semibold shadow-[0_2px_8px_rgba(239,68,68,0.15)] hover:bg-red-600 rounded-[10px] py-2.5 px-5 text-sm",
  };

  const sizeClasses: Record<Size, string> = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-sm",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        // Only apply size padding class if it's not overriding primary/secondary standard padding
        (variant === "ghost" || variant === "danger") && sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
