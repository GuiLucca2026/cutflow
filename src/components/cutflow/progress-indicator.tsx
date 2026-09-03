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

  const numberClass = size === "lg" ? "text-[72px] md:text-[88px]" : size === "sm" ? "text-3xl" : "text-5xl";
  const mutedClass = tone === "light" ? "text-white/[0.68]" : tone === "dark" ? "text-black/[0.58]" : "text-cf-text-dim";
  const trackClass = tone === "light" ? "bg-white/[0.25]" : tone === "dark" ? "bg-black/[0.18]" : "bg-cf-border";
  const fillClass = tone === "light" ? "bg-white" : tone === "dark" ? "bg-black/[0.75]" : "bg-cf-primary";

  return (
    <div ref={ref} className={cn("space-y-2", className)}>
      <div className={cn("font-editorial leading-[0.8] tracking-[-0.035em]", numberClass)}>
        {Math.round(clamped)}<span className="text-[.52em] align-top ml-0.5">%</span>
      </div>
      {label && <div className={cn("cf-micro", mutedClass)}>{label}</div>}
      <div className={cn("h-[2px] w-full overflow-hidden", trackClass)}>
        <div
          className={cn("h-full", fillClass)}
          style={{
            width: `${revealed ? clamped : 0}%`,
            transition: "width var(--cf-dur-progress) var(--cf-ease)",
          }}
        />
      </div>
    </div>
  );
}
