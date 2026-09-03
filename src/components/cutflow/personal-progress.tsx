import { Trophy } from "lucide-react";
import { personalProgressMilestone, type PersonalMonthProgress } from "@/lib/domain";
import { cn } from "@/lib/utils";

// Rodapé da Sidebar e do menu mobile (Fase 15) — pedido do usuário: um
// "sistema de recompensa" pra ver a fila pessoal encolhendo conforme
// entrega, visível em toda página (não só no Meu Dia). Primeira versão
// era só a barra + números; o usuário achou "discreto sem entusiasmo" e
// pediu pra gamificar — ganhou: mensagem de marco que muda com o
// progresso, cor que esquenta conforme enche, e um troféu com "pop" só no
// 100% (não fica piscando o resto do tempo — o momento de comemorar é
// UMA vez, não o card inteiro virando decoração permanente). Ver
// computePersonalMonthProgress/personalProgressMilestone em lib/domain.ts.
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
  const done = delivered === total;
  const accent = done ? "var(--cf-success)" : "var(--cf-primary)";
  const milestone = personalProgressMilestone(progress);
  const segments = [
    editing > 0 ? `${editing} editando` : null,
    waitingClient > 0 ? `${waitingClient} com cliente` : null,
    queue > 0 ? `${queue} em fila` : null,
  ].filter(Boolean);

  return (
    <div
      className="rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: done ? "color-mix(in srgb, var(--cf-success) 12%, transparent)" : "var(--cf-side-surface)",
        border: `1px solid ${done ? "color-mix(in srgb, var(--cf-success) 35%, transparent)" : "var(--cf-side-border)"}`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-cf-side-text/50">Este mês</span>
        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: done ? accent : "var(--cf-side-text)" }}>
          {done && <Trophy key={`trophy-${delivered}`} className="h-3.5 w-3.5 cf-celebrate-pop" style={{ color: accent }} />}
          {delivered}/{total} entregues
        </span>
      </div>

      <div className="text-[11px] font-semibold mb-1.5" style={{ color: accent }}>
        {milestone}
      </div>

      <div className="h-2 rounded-full bg-cf-side-text/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accent }} />
      </div>

      <div className={cn("text-[11px] leading-relaxed mt-2", done ? "text-cf-side-text/60" : "text-cf-side-text/70")}>
        {segments.length > 0 ? segments.join(" · ") : "Tudo entregue este mês."}
      </div>
    </div>
  );
}
