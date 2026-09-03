import { cn } from "@/lib/utils";
import { BRAND_PREFIX, BRAND_ICON_TEXT } from "@/lib/brand";

// Marca "G2 FLOW" — assinatura limpa e estável. Gradientes ficam reservados
// ao contexto visual dos projetos; navegação e identidade-base usam cor sólida
// para preservar hierarquia e evitar aparência de template. Um componente só,
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
        backgroundColor: "var(--cf-primary)",
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
  minimal = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  // Sidebar/menu mobile continuam escuros mesmo no resto do app claro (ver
  // globals.css, tokens --cf-side-*) — "FLOW" em text-cf-text (quase preto)
  // ficaria invisível lá. Este flag troca só a cor do texto, mantém o
  // ícone sólido igual nos dois casos.
  dark?: boolean;
  minimal?: boolean;
}) {
  const iconSize = size === "lg" ? 44 : size === "sm" ? 26 : 32;
  const textClass = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";

  if (minimal) {
    return (
      <div className={cn("flex items-baseline gap-2 leading-none", className)}>
        <span className={cn("font-display tracking-[-0.04em]", textClass, dark ? "text-white" : "text-cf-text")}>{BRAND_PREFIX}</span>
        <span className={cn("cf-micro", dark ? "text-white/45" : "text-cf-text-dim")}>/ FLOW</span>
      </div>
    );
  }

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
