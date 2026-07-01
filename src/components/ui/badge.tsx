import * as React from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "critical" | "warning" | "info" | "success" | "neutral";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  neutral: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

export interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
