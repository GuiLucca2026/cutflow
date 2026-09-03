import { cn } from "@/lib/utils";

export type AtmosphericVariant = "sunset" | "blueHour" | "lavender" | "signal" | "midnight";
export type AtmosphericTone = "light" | "dark";

const VARIANTS: AtmosphericVariant[] = ["sunset", "blueHour", "lavender", "signal", "midnight"];

const VARIANT_CONFIG: Record<
  AtmosphericVariant,
  { base: string; colors: [string, string, string, string]; tone: AtmosphericTone }
> = {
  sunset: {
    base: "#E9DFCC",
    colors: ["var(--cf-cream)", "var(--cf-orange)", "var(--cf-coral)", "var(--cf-red)"],
    tone: "light",
  },
  blueHour: {
    base: "#B7C8E2",
    colors: ["var(--cf-sky)", "var(--cf-deep-blue)", "var(--cf-orange)", "var(--cf-cream)"],
    tone: "light",
  },
  lavender: {
    base: "#DCD2E7",
    colors: ["var(--cf-lavender)", "var(--cf-sky)", "var(--cf-cream)", "var(--cf-coral)"],
    tone: "light",
  },
  signal: {
    base: "#16236D",
    colors: ["var(--cf-blue)", "var(--cf-orange)", "var(--cf-red)", "var(--cf-sky)"],
    tone: "dark",
  },
  midnight: {
    base: "#10155A",
    colors: ["var(--cf-deep-blue)", "var(--cf-blue)", "var(--cf-sky)", "var(--cf-orange)"],
    tone: "dark",
  },
};

function hashSeed(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function seedToFloats(seed: string, count: number): number[] {
  let h = hashSeed(seed);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    out.push((h >>> 0) / 4294967295);
  }
  return out;
}

/** A mesma seed sempre recebe a mesma família de cor. */
export function atmosphericVariantForSeed(seed: string): AtmosphericVariant {
  return VARIANTS[hashSeed(seed) % VARIANTS.length];
}

export function atmosphericTone(variant: AtmosphericVariant): AtmosphericTone {
  return VARIANT_CONFIG[variant].tone;
}

/**
 * Artwork atmosférico do G2 FLOW.
 * O blur pertence às manchas, enquanto o movimento acontece num filho separado:
 * isso evita a disputa entre `translate(-50%, -50%)` de posicionamento e a
 * animação de transform que existia na primeira versão do componente.
 */
export function AtmosphericGradient({
  variant = "sunset",
  seed,
  intensity = 0.92,
  animated = false,
  grain = true,
  className,
}: {
  variant?: AtmosphericVariant;
  seed: string;
  intensity?: number;
  animated?: boolean;
  grain?: boolean;
  className?: string;
}) {
  const config = VARIANT_CONFIG[variant];
  const f = seedToFloats(`${variant}:${seed}`, 16);

  const blobs = config.colors.map((color, i) => {
    const x = i * 4;
    return {
      color,
      top: -5 + f[x] * 105,
      left: -5 + f[x + 1] * 110,
      width: 58 + f[x + 2] * 48,
      height: 48 + f[x + 3] * 52,
      opacity: [0.95, 0.86, 0.72, 0.58][i] * intensity,
    };
  });

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      aria-hidden
      style={{ background: config.base }}
    >
      {blobs.map((blob, i) => (
        <div
          key={`${variant}-${i}`}
          className="absolute"
          style={{
            top: `${blob.top}%`,
            left: `${blob.left}%`,
            width: `${blob.width}%`,
            height: `${blob.height}%`,
            transform: `translate(-50%, -50%) rotate(${Math.round((f[i] - 0.5) * 28)}deg)`,
          }}
        >
          <div
            className={cn(
              "cf-atmosphere-blob",
              animated && (i % 2 === 0 ? "cf-drift" : "cf-drift-alt")
            )}
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${blob.color} 0%, ${blob.color} 42%, color-mix(in srgb, ${blob.color} 18%, transparent) 70%, transparent 100%)`,
              opacity: blob.opacity,
              animationDelay: animated ? `${i * -5.75}s` : undefined,
            }}
          />
        </div>
      ))}

      {/* Uma lavagem muito leve une as manchas sem cair no "gradient SaaS". */}
      <div
        className="absolute inset-0"
        style={{
          background:
            config.tone === "dark"
              ? "radial-gradient(circle at 20% 0%, rgba(255,255,255,.12), transparent 48%), linear-gradient(180deg, rgba(6,8,30,.02), rgba(6,8,30,.20))"
              : "radial-gradient(circle at 15% 0%, rgba(255,255,255,.42), transparent 50%), linear-gradient(180deg, rgba(255,255,255,.02), rgba(21,21,21,.04))",
        }}
      />

      {grain && (
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.022,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.68'/%3E%3C/svg%3E\")",
          }}
        />
      )}
    </div>
  );
}
