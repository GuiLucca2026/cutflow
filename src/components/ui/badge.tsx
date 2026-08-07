import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  color,
  bg,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string; bg?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        !color && "bg-cf-surface-2 text-cf-text-dim",
        className
      )}
      style={color ? { color, backgroundColor: bg ?? `${color}22` } : undefined}
      {...props}
    >
      {children}
    </span>
  );
}
