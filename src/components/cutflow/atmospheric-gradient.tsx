import { cn } from "@/lib/utils";

// Peça central da Fase 2 do rebrand (ver REBRAND-AUDIT.md) — o "artwork"
// atmosférico atrás do Project Card/header de projeto. Construído aqui na
// Fase 1 (design system) mas só passa a APARECER em telas reais na Fase
// 2 — por ora é só o componente pronto pra uso.
//
// Determinismo: a escolha de posição/rotação de cada mancha vem de um
// hash simples do `seed` (ex: project.id), não de Math.random() — o brief
// pede explicitamente isso, pra cada projeto ter uma identidade visual
// ESTÁVEL entre reloads, não sortear uma composição nova a cada render.
//
// São 3-5 radial-gradients desfocados (blur + opacity + transform), sem
// canvas, sem imagem — só CSS. `animated` liga um drift lentíssimo
// (cf-drift, ~22s, ver globals.css) que já respeita
// prefers-reduced-motion via media query global.

export type AtmosphericVariant = "sunset" | "blueHour" | "lavender" | "signal" | "midnight";

const VARIANT_STOPS: Record<AtmosphericVariant, [string, string, string]> = {
  // cream / orange / coral+red
  sunset: ["var(--cf-cream)", "var(--cf-orange)", "var(--cf-coral)"],
  // sky / deep blue / cream
  blueHour: ["var(--cf-sky)", "var(--cf-deep-blue)", "var(--cf-cream)"],
  // sky / lavender / cream
  lavender: ["var(--cf-sky)", "var(--cf-lavender)", "var(--cf-cream)"],
  // blue / orange / red
  signal: ["var(--cf-blue)", "var(--cf-orange)", "var(--cf-red)"],
  // deep blue / blue / sky
  midnight: ["var(--cf-deep-blue)", "var(--cf-blue)", "var(--cf-sky)"],
};

// Hash determinístico pequeno (xmur3-ish) — não precisa ser criptográfico,
// só estável e bem distribuído o bastante pra duas seeds parecidas não
// caírem na mesma composição.
function seedToFloats(seed: string, count: number): number[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    out.push((h >>> 0) / 4294967295);
  }
  return out;
}

export function AtmosphericGradient({
  variant = "sunset",
  seed,
  intensity = 0.85,
  animated = false,
  grain = false,
  className,
}: {
  variant?: AtmosphericVariant;
  /** Chave estável (project.id, client.id...) — mesma seed = mesma composição sempre. */
  seed: string;
  /** 0–1, multiplica a opacidade das manchas. */
  intensity?: number;
  /** Drift ambiente lentíssimo (~22s) — desligado por padrão (custo de motion só onde vale a pena, ex: header de projeto em foco). */
  animated?: boolean;
  /** Ruído sutil sobre o gradiente (<3% opacity) — opcional, desligado por padrão. */
  grain?: boolean;
  className?: string;
}) {
  const [a, b, c] = VARIANT_STOPS[variant];
  const f = seedToFloats(`${variant}:${seed}`, 9);

  const blobs = [
    { color: a, top: 10 + f[0] * 25, left: 5 + f[1] * 20, size: 60 + f[2] * 20, opacity: 0.9 },
    { color: b, top: 30 + f[3] * 40, left: 45 + f[4] * 35, size: 55 + f[5] * 25, opacity: 0.75 },
    { color: c, top: 55 + f[6] * 30, left: 10 + f[7] * 50, size: 50 + f[8] * 20, opacity: 0.65 },
  ];

  return (
    <div className={cn("relative overflow-hidden", className)} aria-hidden style={{ background: "var(--cf-surface-2)" }}>
      {blobs.map((blob, i) => (
        <div
          key={i}
          className={cn("absolute rounded-full", animated && "cf-drift")}
          style={{
            top: `${blob.top}%`,
            left: `${blob.left}%`,
            width: `${blob.size}%`,
            paddingBottom: `${blob.size}%`,
            background: blob.color,
            opacity: blob.opacity * intensity,
            filter: "blur(40px)",
            transform: "translate(-50%, -50%)",
            animationDelay: animated ? `${i * -3.5}s` : undefined,
          }}
        />
      ))}
      {grain && (
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.025,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      )}
    </div>
  );
}
