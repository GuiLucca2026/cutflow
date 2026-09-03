"use client";

import { cn } from "@/lib/utils";

export function FilterSegment<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: { value: T; label: string; count?: number; tone?: "default" | "danger" | "warn" | "good" }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const toneDot = {
    default: "bg-cf-primary",
    danger: "bg-red-500",
    warn: "bg-cf-orange",
    good: "bg-cf-success",
  } as const;

  return (
    <div
      className="flex w-max min-w-full items-center gap-1 overflow-x-auto rounded-[10px] border border-cf-border bg-cf-surface p-1 sm:min-w-0"
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[7px] px-3 text-[12px] font-medium transition-[background-color,color,border-color] duration-[var(--cf-dur-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/22",
              active
                ? "bg-cf-surface-2 text-cf-text"
                : "text-cf-text-dim hover:bg-black/[0.025] hover:text-cf-text"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full transition-opacity", toneDot[item.tone ?? "default"], active ? "opacity-100" : "opacity-35")} />
            <span>{item.label}</span>
            {typeof item.count === "number" ? (
              <span className={cn("min-w-5 text-right text-[11px] font-semibold tabular-nums", active ? "text-cf-text" : "text-cf-text-dim")}>{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
