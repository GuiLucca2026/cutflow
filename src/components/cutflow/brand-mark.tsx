import { cn } from "@/lib/utils";
import { BRAND_PREFIX, BRAND_ICON_TEXT } from "@/lib/brand";

// Marca "G2 FLOW" — ícone em gradiente na cor de ação do rebrand (era
// roxo→índigo na rodada anterior; ver REBRAND-AUDIT.md) + wordmark em
// dois tons (G2 na cor da marca, FLOW em texto normal). Um componente só,
// reaproveitado em toda tela onde a marca aparece (Sidebar, menu mobile,
// /sso, /login, /convite), pra nunca ficar dessincronizada entre os
// lugares.
//
// Prefixo/ícone vêm de lib/brand.ts (variável de ambiente) — outra
// instância deste mesmo código (outra produtora, outro deploy) troca só a
// variável e o logo inteiro segue.
export function BrandIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-lg font-display text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: "linear-gradient(135deg, var(--cf-sky) 0%, var(--cf-blue) 55%, var(--cf-deep-blue) 100%)",
      }}
    >
      {BRAND_ICON_TEXT}
    </div>
  );
}

export function BrandWordmark({
  size = "md",
  className,
  dark = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  // Sidebar/menu mobile continuam escuros mesmo no resto do app claro (ver
  // globals.css, tokens --cf-side-*) — "FLOW" em text-cf-text (quase preto)
  // ficaria invisível lá. Este flag troca só a cor do texto, mantém o
  // ícone (que já é branco sobre gradiente) igual nos dois casos.
  dark?: boolean;
}) {
  const iconSize = size === "lg" ? 44 : size === "sm" ? 26 : 32;
  const textClass = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandIcon size={iconSize} />
      <div className={cn("font-display leading-none tracking-tight", textClass)}>
        <span style={{ color: dark ? "var(--cf-sky)" : "var(--cf-primary)" }}>{BRAND_PREFIX}</span>{" "}
        <span className={dark ? "text-white" : "text-cf-text"}>FLOW</span>
      </div>
    </div>
  );
}
