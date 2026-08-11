"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/domain";

// Cor de usuário é dado livre (cada pessoa escolhe a sua no perfil, e
// quem nunca trocou ainda carrega o default do tema escuro antigo,
// #C6FF00 — lime). O avatar sempre desenha as iniciais NA MESMA cor sobre
// um tom bem claro dela mesma (`${color}2a`), o que só tem contraste OK
// quando a cor de base é escura/saturada. Pra cores claras (lime, amarelo,
// ciano claro) — texto claro sobre fundo ainda mais claro da mesma cor —
// as iniciais praticamente somem. Em vez de confiar que toda cor
// cadastrada é escura o bastante, calculamos a luminância e escurecemos
// só o texto/borda quando preciso; o tom de fundo continua o original, a
// "cor da pessoa" ainda é reconhecível, só o texto fica legível.
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function readableAccent(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  // Luminância percebida (0–1) — acima de ~0.68 a cor é clara o bastante
  // pra ficar ilegível sobre seu próprio tom pastel de fundo.
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  if (luminance <= 0.68) return color;
  const factor = 0.5; // escurece ~50%, mantendo o matiz reconhecível
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

export function Avatar({
  name,
  color = "#7C3AED",
  src,
  size = 28,
  className,
  title,
}: {
  name: string;
  color?: string;
  // Optional real profile photo URL — falls back to initials-on-color when
  // absent (or if the image fails to load).
  src?: string | null;
  size?: number;
  className?: string;
  // Tooltip override — por padrão é só o nome, mas quem precisa mostrar
  // mais contexto (ex: "Fulano · Motion Graphics" na equipe do vídeo) pode
  // sobrescrever sem precisar de um wrapper com title próprio (o title do
  // elemento mais interno é o que o navegador mostra, então um title num
  // <div> por fora deste componente seria ignorado).
  title?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const accent = readableAccent(color);
  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        title={title ?? name}
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
        color: accent,
        border: `1px solid ${accent}55`,
      }}
      title={title ?? name}
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
