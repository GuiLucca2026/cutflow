import { cn } from "@/lib/utils";

export type AtmosphericVariant = "sunset" | "blueHour" | "lavender" | "signal" | "midnight";
export type AtmosphericTone = "light" | "dark";

const VARIANTS: AtmosphericVariant[] = ["sunset", "blueHour", "lavender", "signal", "midnight"];

const VARIANT_CONFIG: Record<
  AtmosphericVariant,
  { base: string; colors: string[]; tone: AtmosphericTone }
> = {
  sunset: {
    base: "#E7D8C3",
    colors: ["#F4E4C9", "#F2A04F", "#F15B3A", "#A82920", "#2B100D"],
    tone: "light",
  },
  blueHour: {
    base: "#AFC1DC",
    colors: ["#BCD0EA", "#3158B1", "#101A60", "#ED9251", "#E9DCC8"],
    tone: "light",
  },
  lavender: {
    base: "#D8CCE4",
    colors: ["#D7C4E8", "#9EB7DC", "#746BA8", "#F17A61", "#EFE3D0"],
    tone: "light",
  },
  signal: {
    base: "#111A59",
    colors: ["#0D174F", "#2447A6", "#EF9A50", "#D63A2C", "#321313"],
    tone: "dark",
  },
  midnight: {
    base: "#090E3B",
    colors: ["#06092A", "#111B67", "#284CB0", "#89A9D7", "#E9834D"],
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

/** A mesma seed também recebe uma das composições editoriais dos posters. */
export function atmosphericLayoutForSeed(seed: string): 0 | 1 | 2 {
  return (hashSeed(`layout:${seed}`) % 3) as 0 | 1 | 2;
}

export function atmosphericTone(variant: AtmosphericVariant): AtmosphericTone {
  return VARIANT_CONFIG[variant].tone;
}

/** Cor sólida derivada da mesma seed do artwork.
 * Uso: superfícies densas/repetidas onde o gradiente completo pesaria
 * demais (ex: KanbanCard, uma coluna cheia de itens compactos) — ali a
 * identidade vira só um traço/pill sólido. Onde o card tem espaço pra
 * respirar (ProjectCard, ClientsExplorer, VideoCard) o gradiente completo
 * é usado direto via <AtmosphericGradient>: gradiente marca "isto é uma
 * identidade" (projeto, cliente, ou o projeto por trás de um vídeo) — não
 * é decoração solta, por isso ainda vale restringir a esses três lugares.
 */
export function projectAccentForSeed(seed: string) {
  const variant = atmosphericVariantForSeed(seed);
  const config = VARIANT_CONFIG[variant];
  const preferredIndex: Record<AtmosphericVariant, number> = {
    sunset: 2,
    blueHour: 1,
    lavender: 2,
    signal: 1,
    midnight: 2,
  };
  return config.colors[preferredIndex[variant]];
}

/** Alias legado. Novos componentes devem preferir projectAccentForSeed. */
export function atmosphericAccentForSeed(seed: string) {
  return projectAccentForSeed(seed);
}

/**
 * Artwork atmosférico do G2 FLOW.
 * A intenção é parecer luz fotografada fora de foco, não um gradiente SaaS:
 * manchas grandes, zonas neutras, contraste cromático e movimento muito lento.
 */
export function AtmosphericGradient({
  variant = "sunset",
  seed,
  intensity = 0.94,
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
  const f = seedToFloats(`${variant}:${seed}`, config.colors.length * 4 + 8);

  const blobs = config.colors.map((color, i) => {
    const x = i * 4;
    return {
      color,
      top: -12 + f[x] * 124,
      left: -12 + f[x + 1] * 124,
      width: 64 + f[x + 2] * 58,
      height: 58 + f[x + 3] * 60,
      opacity: [0.98, 0.93, 0.82, 0.64, 0.42][i] * intensity,
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
            transform: `translate(-50%, -50%) rotate(${Math.round((f[i] - 0.5) * 34)}deg)`,
          }}
        >
          <div
            className={cn(
              "cf-atmosphere-blob",
              animated && (i % 2 === 0 ? "cf-drift" : "cf-drift-alt")
            )}
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${blob.color} 0%, ${blob.color} 34%, color-mix(in srgb, ${blob.color} 58%, transparent) 55%, color-mix(in srgb, ${blob.color} 18%, transparent) 74%, transparent 100%)`,
              opacity: blob.opacity,
              animationDelay: animated ? `${i * -4.9}s` : undefined,
            }}
          />
        </div>
      ))}

      <div
        className="absolute inset-0"
        style={{
          background:
            config.tone === "dark"
              ? "radial-gradient(circle at 18% -8%, rgba(255,255,255,.16), transparent 40%), radial-gradient(circle at 92% 105%, rgba(0,0,0,.28), transparent 48%), linear-gradient(180deg, rgba(4,7,28,.02), rgba(4,7,28,.18))"
              : "radial-gradient(circle at 14% -8%, rgba(255,255,255,.52), transparent 42%), radial-gradient(circle at 92% 110%, rgba(20,12,8,.13), transparent 48%), linear-gradient(180deg, rgba(255,255,255,.01), rgba(21,21,21,.055))",
        }}
      />

      <div
        className={cn("cf-atmosphere-veil absolute -inset-[24%]", animated && "cf-atmosphere-veil--animated")}
        style={{
          background:
            config.tone === "dark"
              ? "radial-gradient(ellipse at 38% 48%, rgba(255,255,255,.18), transparent 34%), radial-gradient(ellipse at 72% 42%, rgba(255,139,82,.12), transparent 32%)"
              : "radial-gradient(ellipse at 36% 46%, rgba(255,255,255,.46), transparent 33%), radial-gradient(ellipse at 76% 58%, rgba(255,117,76,.10), transparent 30%)",
        }}
      />

      {grain && (
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.026,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E\")",
          }}
        />
      )}
    </div>
  );
}

/**
 * Versão "menor" do artwork atmosférico — pra superfícies de ESTADO, não de
 * identidade (KPI hero, card de dia da semana): a cor vem de fora (o accent
 * que já representa "atrasado"/"hoje"/"cheio"/"livre" etc.), não de uma seed
 * própria. Um único glow radial no canto, sem blobs múltiplos, sem grain —
 * dá a mesma sensação de luz colorida sem competir com o sinal de estado
 * que a cor já carrega.
 */
export function AccentWash({ color, className }: { color: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{
        background: `radial-gradient(130% 150% at 12% -25%, color-mix(in srgb, ${color} 30%, transparent) 0%, color-mix(in srgb, ${color} 12%, transparent) 40%, transparent 70%)`,
      }}
    />
  );
}
