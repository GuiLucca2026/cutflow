import type { PersonalMonthProgress } from "@/lib/domain";

// Rodapé da Sidebar e do menu mobile (Fase 15) — pedido do usuário: um
// "sistema de recompensa" simples pra ver a fila pessoal encolhendo
// conforme entrega, visível em toda página (não só no Meu Dia). De
// propósito NÃO é gamificação (sem badge, sem streak, sem confete) — só o
// número real de trabalho entregue vs. o que ainda falta este mês, ver
// computePersonalMonthProgress em lib/domain.ts.
export function PersonalProgressWidget({ progress }: { progress?: PersonalMonthProgress }) {
  if (!progress) return null;

  const { total, delivered, editing, waitingClient, queue } = progress;

  if (total === 0) {
    return (
      <div
        className="rounded-lg px-3 py-2.5 text-[11px] text-cf-side-text/60 leading-relaxed"
        style={{ background: "var(--cf-side-surface)", border: "1px solid var(--cf-side-border)" }}
      >
        Nenhum vídeo seu com prazo este mês.
      </div>
    );
  }

  const pct = Math.round((delivered / total) * 100);
  const segments = [
    editing > 0 ? `${editing} editando` : null,
    waitingClient > 0 ? `${waitingClient} com cliente` : null,
    queue > 0 ? `${queue} em fila` : null,
  ].filter(Boolean);

  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: "var(--cf-side-surface)", border: "1px solid var(--cf-side-border)" }}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-cf-side-text/50">Este mês</span>
        <span className="text-xs font-semibold text-cf-side-text">
          {delivered}/{total} entregues
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-cf-side-text/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#7C3AED" }} />
      </div>
      <div className="text-[11px] text-cf-side-text/70 leading-relaxed mt-2">
        {segments.length > 0 ? segments.join(" · ") : "Tudo entregue este mês."}
      </div>
    </div>
  );
}
