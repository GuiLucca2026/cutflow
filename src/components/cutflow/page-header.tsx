import { cn } from "@/lib/utils";

// Consolida o cabeçalho que 15 páginas reescreviam à mão (mesmo
// h1 + p sempre, ver REBRAND-AUDIT.md § design debt #2). Ainda não
// aplicado a nenhuma página — isso é trabalho da Fase 3/4 (aplicar a
// linguagem nova tela por tela, preservando o que já funciona); aqui só
// o componente fica pronto.
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h1 className="font-display text-4xl tracking-wide">{title}</h1>
        {subtitle && <p className="text-cf-text-dim text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// Cabeçalho de seção — mesmo "título + contador" que Meu Dia/Entregas/
// Revisões já reescreviam cada um do seu jeito (ver Section() em
// hoje/page.tsx, por exemplo). Migração pra este componente compartilhado
// também é Fase 3/4.
export function SectionHeader({
  title,
  subtitle,
  count,
  tone,
  className,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  tone?: "danger";
  className?: string;
}) {
  return (
    <div className={cn("mb-3", className)}>
      <div className="flex items-baseline gap-2">
        <h2 className={cn("font-display text-2xl tracking-wide", tone === "danger" && "text-red-600")}>{title}</h2>
        {typeof count === "number" && <span className="text-cf-text-dim text-sm">{count}</span>}
      </div>
      {subtitle && <p className="text-xs text-cf-text-dim mt-0.5">{subtitle}</p>}
    </div>
  );
}
