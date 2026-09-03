import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-[var(--cf-radius-input)] border border-cf-border bg-cf-surface-2 px-3 py-2 text-sm text-cf-text placeholder:text-cf-text-dim focus:outline-none focus:ring-2 focus:ring-cf-lime/40 disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
