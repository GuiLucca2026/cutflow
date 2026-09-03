"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, Check } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyWeekPlan } from "@/app/actions";
import { fmtHours } from "@/lib/format";
import type { PlanDay } from "@/lib/planning";

// Planejamento da semana — antes era uma aba própria do Meu Dia; agora é o
// cabeçalho da página, acima dos cards (pedido do usuário). Por isso o
// layout virou uma FAIXA: título + ação na mesma linha, dias de folga
// encolhidos numa coluna estreita (antes ocupavam o mesmo espaço de um
// dia útil só pra escrever "Folga"), texto explicativo longo virou
// tooltip. A lógica (planWeek em lib/planning.ts) não mudou.
export function WeekPlanBoard({
  days,
  unallocatedHours,
  totalHoursLeft,
  dailyCapacityHours,
}: {
  days: PlanDay[];
  unallocatedHours: number;
  totalHoursLeft: number;
  dailyCapacityHours: number;
}) {
  const [pending, setPending] = React.useState(false);
  const [applied, setApplied] = React.useState(false);

  function apply() {
    const entries = days.flatMap((d) => d.items.map((it) => ({ videoId: it.videoId, date: d.date, hours: it.hours })));
    if (entries.length === 0) {
      toast.error("Nada pra aplicar — sem vídeos com horas restantes.");
      return;
    }
    setPending(true);
    applyWeekPlan(entries)
      .then(() => {
        setApplied(true);
        toast.success("Plano aplicado — já aparece em Equipe > carga de trabalho.");
      })
      .catch(() => toast.error("Não foi possível aplicar o plano."))
      .finally(() => setPending(false));
  }

  const hasWork = days.some((d) => d.items.length > 0);

  return (
    <section className="rounded-xl border border-cf-border bg-cf-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-cf-border">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarClock className="h-4 w-4 text-cf-text-dim shrink-0" />
          <h2 className="font-display text-lg tracking-wide">Sua semana</h2>
          <Hint text={`Distribuição automática das ${fmtHours(totalHoursLeft)} restantes nos próximos 7 dias, respeitando sua capacidade diária (${fmtHours(dailyCapacityHours)}) e priorizando o prazo mais próximo.`}>
            <span className="text-xs text-cf-text-dim cursor-help border-b border-dotted border-cf-text-dim/40">
              {fmtHours(totalHoursLeft)} restantes · como funciona?
            </span>
          </Hint>
        </div>

        {unallocatedHours > 0.05 && (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            {fmtHours(unallocatedHours)} não cabem esta semana — peça ajuda ou renegocie um prazo
          </span>
        )}

        <button
          onClick={apply}
          disabled={pending || applied || !hasWork}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-cf-lime px-3 py-1.5 text-xs font-semibold text-cf-on-accent transition hover:brightness-95 disabled:opacity-50"
        >
          {applied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Plano aplicado
            </>
          ) : pending ? (
            "Aplicando..."
          ) : (
            "Aplicar na minha carga"
          )}
        </button>
      </div>

      {!hasWork ? (
        <div className="px-4 py-5 text-sm text-cf-text-dim">Nenhum vídeo ativo com horas restantes atribuído a você.</div>
      ) : (
        <div className="flex gap-2 p-3 overflow-x-auto cf-scrollbar-thin">
          {days.map((day) => {
            const d = new Date(`${day.date}T00:00:00`);
            const pct = day.capacityHours > 0 ? Math.min(100, Math.round((day.allocatedHours / day.capacityHours) * 100)) : 0;
            const over = day.allocatedHours > day.capacityHours + 0.05;
            const today = day === days[0];

            if (!day.isWorkDay) {
              return (
                <div
                  key={day.date}
                  className="flex w-9 shrink-0 flex-col items-center justify-start rounded-lg bg-cf-surface-2/60 py-2 text-[10px] text-cf-text-dim/60"
                  title={`${format(d, "EEEE", { locale: ptBR })} — folga`}
                >
                  <span className="font-semibold uppercase">{format(d, "EEEEE", { locale: ptBR })}</span>
                  <span>{format(d, "dd")}</span>
                </div>
              );
            }

            return (
              <div
                key={day.date}
                className={cn(
                  "flex min-w-[150px] flex-1 flex-col rounded-lg border p-2.5",
                  today ? "border-cf-lime/50 bg-cf-lime/5" : "border-cf-border"
                )}
              >
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold capitalize">
                    {today ? "Hoje" : format(d, "EEE", { locale: ptBR })}
                    <span className="ml-1 font-normal text-cf-text-dim">{format(d, "dd/MM")}</span>
                  </span>
                  <span className={cn("text-[10px] tabular-nums", over ? "font-semibold text-red-600" : "text-cf-text-dim")}>
                    {fmtHours(day.allocatedHours)}/{fmtHours(day.capacityHours)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-cf-surface-2 overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-cf-lime")} style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-1">
                  {day.items.length === 0 ? (
                    <div className="text-[11px] text-cf-text-dim/50">Livre</div>
                  ) : (
                    day.items.map((it, i) => (
                      <div key={i} className="rounded-md bg-cf-surface-2 px-2 py-1 text-[11px] leading-tight">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-cf-text-dim truncate">
                          {it.projectName} · {fmtHours(it.hours)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
