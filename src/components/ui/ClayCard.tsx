import { cn } from "@/lib/utils/format";

interface ClayCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "solar" | "eco" | "data" | "none";
  variant?: "standard" | "featured" | "metric";
  hover?: boolean;
  onClick?: () => void;
}

export function ClayCard({
  children,
  className,
  glow = "none",
  variant,
  hover = false,
  onClick,
}: ClayCardProps) {
  // Determine CSS class based on variant or backward-compatible glow prop
  let cardClass = "card";
  
  if (variant) {
    if (variant === "featured") cardClass = "card-featured";
    else if (variant === "metric") cardClass = "card-metric";
    else cardClass = "card";
  } else {
    // Map existing glow variants to Solar Serenity card system
    if (glow === "solar" || glow === "eco" || glow === "data") {
      cardClass = "card-featured";
    } else {
      cardClass = "card";
    }
  }

  return (
    <div
      className={cn(
        cardClass,
        hover && "cursor-pointer transition-all duration-200 hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
