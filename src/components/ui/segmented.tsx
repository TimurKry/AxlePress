"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  name: string;
  label: string;
  value: T | "";
  options: { value: T; label: ReactNode; testId?: string }[];
  onChange: (value: T) => void;
  className?: string;
  columns?: string;
}

/** Radio group rendered as large segmented buttons (keyboard + screen-reader friendly). */
export function Segmented<T extends string>({ name, label, value, options, onChange, className, columns }: SegmentedProps<T>) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-1.5 text-sm font-medium text-muted">{label}</legend>
      <div className={cn("grid gap-2", columns ?? "grid-cols-2 sm:grid-cols-4")}>
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              data-testid={o.testId}
              className={cn(
                "relative flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked
                  ? "border-accent bg-accent/12 text-text"
                  : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-text",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
