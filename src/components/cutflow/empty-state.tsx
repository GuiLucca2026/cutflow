import { cn } from "@/lib/utils";

// Empty state editorial (brief § 36): sem ícone gigante dentro de
// círculo, bastante espaço negativo, título curto + uma linha de
// contexto + ação opcional. Substitui as ~10 divs "Nada aqui"/"Nenhum
// vídeo..." espalhadas pelas páginas — migração é Fase 3/4, componente
// fica pronto aqui.
export function EmptyState({
  title,
  description,
  action,
  compact = false,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Versão menor pra dentro de uma seção (em vez de tela inteira). */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-y border-cf-border text-center",
        compact ? "px-6 py-8" : "px-8 py-16",
        className
      )}
    >
      <div className={cn("font-semibold tracking-[-0.035em]", compact ? "text-xl" : "text-3xl")}>{title}</div>
      {description && <p className="mt-2 text-sm text-cf-text-dim max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
