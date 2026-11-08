import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium [&_svg]:size-3.5", {
  variants: {
    variant: {
      neutral: "bg-surface-3 text-muted",
      accent: "bg-accent/12 text-accent border border-accent/30",
      ok: "bg-ok-bg text-ok border border-ok/30",
      warn: "bg-warn-bg text-warn border border-warn/30",
      danger: "bg-danger-bg text-danger border border-danger/30",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
