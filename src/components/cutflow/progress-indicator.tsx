"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Variante "editorial" do progresso (brief § 10 e § 32) — pro Project
// Card/header de projeto na Fase 2: número grande em Instrument Serif +
// label técnica pequena + barra fina (1-3px), em vez do
// Progress[=====    ]60% genérico que ui/progress.tsx já cobre bem pra
// contexto operacional (Checklist da ficha do vídeo etc. continuam
// usando aquele — este é só um segundo "rosto" pro mesmo dado, pensado
// pro card/poster).
//
// Anima de 0 → value na primeira vez que aparece em tela (IntersectionObserver
// simples, sem depender de biblioteca de scroll-reveal) — ver brief § 10:
// 700-1000ms, sem bounce. prefers-reduced-motion é tratado pela media
// query global em globals.css (zera a duração da transition), não aqui —
// evita w chamar setState de dentro do efeito só pra decidir "anima ou
// não" (a média query já cobre os dois casos com uma única barra CSS).
export function ProgressIndicator({
  value,
  label,
  size = "md",
  className,
}: {
  /** 0–100 */
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
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
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const numberClass = size === "lg" ? "text-6xl" : size === "sm" ? "text-3xl" : "text-4xl";

  return (
    <div ref={ref} className={cn("space-y-1.5", className)}>
      <div className={cn("font-editorial leading-none", numberClass)}>{Math.round(clamped)}%</div>
      {label && <div className="cf-micro text-cf-text-dim">{label}</div>}
      <div className="h-[2px] w-full rounded-full bg-cf-border overflow-hidden">
        <div
          className="h-full rounded-full bg-cf-lime"
          style={{
            width: `${revealed ? clamped : 0}%`,
            transition: "width var(--cf-dur-progress) var(--cf-ease)",
          }}
        />
      </div>
    </div>
  );
}
