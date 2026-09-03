"use client";

import * as React from "react";
import { initials } from "@/lib/domain";
import { readableAccent } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ClientLogo({
  name,
  color = "#2649A8",
  logoUrl,
  size = 32,
  onDark = false,
  variant = "default",
  className,
}: {
  name: string;
  color?: string;
  logoUrl?: string | null;
  size?: number;
  onDark?: boolean;
  variant?: "default" | "poster";
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const accent = readableAccent(color);

  if (logoUrl && !errored) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          variant === "poster" ? "rounded-[6px] p-1.5" : "rounded-[var(--cf-radius-input)] p-1",
          onDark ? "bg-white/[0.92]" : variant === "default" ? "bg-black/[0.035]" : "bg-white/[0.45]",
          className
        )}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} onError={() => setErrored(true)} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  if (variant === "poster") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[6px] border font-semibold tracking-[-0.04em]",
          onDark ? "border-white/[0.28] bg-black/[0.10] text-white" : "border-black/[0.18] bg-white/[0.18] text-black/[0.80]",
          className
        )}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
        title={name}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-[var(--cf-radius-input)] font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: `${color}2a`,
        color: accent,
        border: `1px solid ${accent}55`,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
