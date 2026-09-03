import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-[var(--cf-radius-input)] border border-cf-border bg-cf-surface-2 px-3 py-2 text-sm text-cf-text placeholder:text-cf-text-dim focus:outline-none focus:ring-2 focus:ring-cf-lime/40 disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
