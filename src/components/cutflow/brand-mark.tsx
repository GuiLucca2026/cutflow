import { cn } from "@/lib/utils";

// Marca "G2 FLOW" — ícone em gradiente roxo→índigo (conceito enviado pelo
// usuário) + wordmark em dois tons (G2 na cor da marca, FLOW em texto
// normal). Um componente só, reaproveitado em toda tela onde a marca
// aparece (Sidebar, menu mobile, /sso, /login, /convite), pra nunca ficar
// dessincronizada entre os lugares.
export function BrandIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-lg font-display text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 55%, #4338CA 100%)",
      }}
    >
      G2
    </div>
  );
}

export function BrandWordmark({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const iconSize = size === "lg" ? 44 : size === "sm" ? 26 : 32;
  const textClass = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandIcon size={iconSize} />
      <div className={cn("font-display leading-none tracking-tight", textClass)}>
        <span style={{ color: "#7C3AED" }}>G2</span> <span className="text-cf-text">FLOW</span>
      </div>
    </div>
  );
}
