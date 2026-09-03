import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[88px] w-full resize-y rounded-[var(--cf-radius-input)] border border-cf-border bg-cf-surface px-3 py-2.5 text-sm leading-6 text-cf-text placeholder:text-cf-text-dim/75 transition-[border-color,background-color,box-shadow] duration-[var(--cf-dur-hover)] hover:border-cf-border-strong focus:border-cf-primary/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cf-primary/16 disabled:cursor-not-allowed disabled:bg-cf-surface-2 disabled:opacity-55",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
