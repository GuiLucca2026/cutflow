"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function ProgressIndicator({
  value,
  label,
  size = "md",
  tone = "default",
  className,
}: {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "light" | "dark";
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = React.useState(false);
  const clamped = Math.max(0, Math.min(100, value));

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const numberClass = size === "lg" ? "text-[48px] md:text-[56px]" : size === "sm" ? "text-2xl" : "text-4xl";
  const mutedClass = tone === "light" ? "text-white/[0.72]" : tone === "dark" ? "text-black/[0.62]" : "text-cf-text-dim";
  const trackClass = tone === "light" ? "bg-white/[0.28]" : tone === "dark" ? "bg-black/[0.18]" : "bg-cf-border";
  const fillClass = tone === "light" ? "bg-white" : tone === "dark" ? "bg-black/[0.78]" : "bg-cf-primary";

  return (
    <div ref={ref} className={cn("space-y-2.5", className)}>
      <div className="flex items-end justify-between gap-3">
        {label ? <div className={cn("cf-micro pb-1", mutedClass)}>{label}</div> : <span />}
        <div className={cn("font-sans font-semibold tabular-nums leading-none tracking-[-0.045em]", numberClass)}>
          {Math.round(clamped)}<span className="ml-0.5 text-[0.48em] font-medium align-top">%</span>
        </div>
      </div>
      <div className={cn("h-[3px] w-full overflow-hidden rounded-full", trackClass)}>
        <div
          className={cn("h-full rounded-full", fillClass)}
          style={{
            width: `${revealed ? clamped : 0}%`,
            transition: "width var(--cf-dur-progress) var(--cf-ease)",
          }}
        />
      </div>
    </div>
  );
}
