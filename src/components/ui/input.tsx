import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-[var(--cf-radius-input)] border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text placeholder:text-cf-text-dim/75 transition-[border-color,background-color,box-shadow] duration-[var(--cf-dur-hover)] hover:border-cf-border-strong focus:border-cf-primary/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cf-primary/16 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-cf-surface-2 disabled:opacity-55",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
