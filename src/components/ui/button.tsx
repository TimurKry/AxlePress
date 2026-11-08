import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
    "disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[1.15em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-contrast hover:bg-accent-strong",
        secondary: "bg-surface-3 text-text hover:bg-border border border-border",
        outline: "border border-border-strong bg-transparent text-text hover:bg-surface-2",
        ghost: "bg-transparent text-muted hover:text-text hover:bg-surface-2",
        destructive: "bg-transparent text-danger border border-danger/40 hover:bg-danger-bg",
      },
      size: {
        default: "h-12 px-5 text-base",
        sm: "h-10 px-3.5 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
