"use client";

import * as React from "react";
import { initials } from "@/lib/domain";
import { readableAccent } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Componente novo do rebrand (ver REBRAND-AUDIT.md, seção 9 do brief) —
// ainda SEM dado real por trás: `Client` não tem coluna de logo hoje
// (decisão registrada na auditoria — upload de arquivo é feature nova,
// fica pra um pedido separado, com sua própria migração SQL). Construído
// já pronto pra receber `logoUrl` assim que essa coluna existir; até lá,
// todo cliente cai no fallback de iniciais.
//
// Container "mínimo" de propósito (canto levemente arredondado, sem caixa
// branca forçada) — o brief pede explicitamente pra não meter todo logo
// dentro de um quadrado branco. `onDark` é o único ajuste manual de
// contraste disponível (sem processamento de imagem não dá pra detectar
// se um logo é "claro" ou "escuro" de verdade): quando o card por trás é
// escuro/colorido (ex: sobre um AtmosphericGradient), liga um leve chip
// translúcido atrás do logo em vez de inverter cor às cegas.
export function ClientLogo({
  name,
  color = "#7C3AED",
  logoUrl,
  size = 32,
  onDark = false,
  className,
}: {
  name: string;
  color?: string;
  logoUrl?: string | null;
  size?: number;
  onDark?: boolean;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const accent = readableAccent(color);

  if (logoUrl && !errored) {
    return (
      <div
        className={cn("flex shrink-0 items-center justify-center rounded-[var(--cf-radius-input)] p-1", onDark && "bg-white/85 backdrop-saturate-150", className)}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} onError={() => setErrored(true)} className="max-h-full max-w-full object-contain" />
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
