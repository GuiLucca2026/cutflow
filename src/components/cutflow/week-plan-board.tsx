"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyWeekPlan } from "@/app/actions";
import { fmtHours } from "@/lib/format";
import type { PlanDay } from "@/lib/planning";

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
    <section>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-cf-border pb-3">
        <div>
          <div className="cf-micro text-cf-text-dim">WEEK / AUTO PLAN</div>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="text-[28px] font-semibold tracking-[-0.035em]">Sua semana</h2>
            <Hint text={`Distribuição automática das ${fmtHours(totalHoursLeft)} restantes nos próximos 7 dias, respeitando sua capacidade diária (${fmtHours(dailyCapacityHours)}) e priorizando o prazo mais próximo.`}>
              <span className="cursor-help text-xs text-cf-text-dim">{fmtHours(totalHoursLeft)} restantes · como funciona?</span>
            </Hint>
          </div>
        </div>

        {unallocatedHours > 0.05 && (
          <span className="cf-micro text-amber-700">● {fmtHours(unallocatedHours)} não cabem esta semana</span>
        )}

        <button
          onClick={apply}
          disabled={pending || applied || !hasWork}
          className="ml-auto inline-flex items-center gap-1.5 border-b border-cf-primary px-0 py-1 text-xs font-semibold text-cf-primary transition-colors hover:text-cf-primary-hover disabled:opacity-45"
        >
          {applied ? <><Check className="h-3.5 w-3.5" /> Plano aplicado</> : pending ? "Aplicando..." : "Aplicar na minha carga →"}
        </button>
      </div>

      {!hasWork ? (
        <div className="border-b border-cf-border py-8 text-sm text-cf-text-dim">Nenhum vídeo ativo com horas restantes atribuído a você.</div>
      ) : (
        <div className="cf-scrollbar-thin flex overflow-x-auto border-b border-cf-border">
          {days.map((day) => {
            const d = new Date(`${day.date}T00:00:00`);
            const pct = day.capacityHours > 0 ? Math.min(100, Math.round((day.allocatedHours / day.capacityHours) * 100)) : 0;
            const over = day.allocatedHours > day.capacityHours + 0.05;
            const today = day === days[0];

            if (!day.isWorkDay) {
              return (
                <div key={day.date} className="flex min-w-[132px] flex-1 flex-col items-start justify-start border-r border-cf-border px-3 py-4 text-[10px] text-cf-text-dim/60" title={`${format(d, "EEEE", { locale: ptBR })} — folga`}>
                  <span className="cf-micro">{format(d, "EEE", { locale: ptBR }).toUpperCase()}</span>
                  <span className="mt-1 text-xl font-semibold tabular-nums leading-none">{format(d, "dd")}</span>
                </div>
              );
            }

            return (
              <div key={day.date} className={cn("min-w-[180px] flex-1 border-r border-cf-border px-3 py-4", today && "bg-cf-primary/[0.025]") }>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className={cn("cf-micro", today ? "text-cf-primary" : "text-cf-text-dim")}>{today ? "TODAY" : format(d, "EEE", { locale: ptBR }).toUpperCase()}</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums leading-none">{format(d, "dd")}</div>
                  </div>
                  <span className={cn("text-[10px] tabular-nums", over ? "font-semibold text-red-600" : "text-cf-text-dim")}>{fmtHours(day.allocatedHours)}/{fmtHours(day.capacityHours)}</span>
                </div>

                <div className="mb-3 h-[2px] overflow-hidden bg-cf-border">
                  <div className={cn("h-full", over ? "bg-red-500" : "bg-cf-primary")} style={{ width: `${pct}%` }} />
                </div>

                <div className="space-y-2">
                  {day.items.length === 0 ? (
                    <div className="text-[11px] text-cf-text-dim/55">Livre</div>
                  ) : day.items.map((it, i) => (
                    <div key={i} className="border-t border-cf-border pt-2 text-[11px] leading-tight">
                      <div className="truncate font-medium">{it.name}</div>
                      <div className="mt-0.5 truncate text-cf-text-dim">{it.projectName} · {fmtHours(it.hours)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
