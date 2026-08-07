"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/domain";

export function Avatar({
  name,
  color = "#C6FF00",
  src,
  size = 28,
  className,
}: {
  name: string;
  color?: string;
  // Optional real profile photo URL — falls back to initials-on-color when
  // absent (or if the image fails to load).
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className={cn("rounded-full object-cover shrink-0 border border-cf-border", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn("flex items-center justify-center rounded-full font-semibold shrink-0", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: `${color}2a`,
        color,
        border: `1px solid ${color}55`,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ people, max = 4 }: { people: { name: string; color?: string }[]; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={i} name={p.name} color={p.color} size={26} className="ring-2 ring-cf-surface" />
      ))}
      {rest > 0 && (
        <div className="flex items-center justify-center rounded-full ring-2 ring-cf-surface bg-cf-surface-2 text-cf-text-dim text-[11px] font-semibold" style={{ width: 26, height: 26 }}>
          +{rest}
        </div>
      )}
    </div>
  );
}
