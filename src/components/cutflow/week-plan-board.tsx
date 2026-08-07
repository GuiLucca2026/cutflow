"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { applyWeekPlan } from "@/app/actions";
import { fmtHours } from "@/lib/format";
import type { PlanDay } from "@/lib/planning";

export function WeekPlanBoard({ days, unallocatedHours }: { days: PlanDay[]; unallocatedHours: number }) {
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

  return (
    <div className="space-y-4">
      {unallocatedHours > 0.05 && (
        <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-600">
          {fmtHours(unallocatedHours)} não couberam nos próximos dias respeitando sua capacidade diária — considere pedir
          ajuda ou renegociar algum prazo.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {days.map((day) => {
          const pct = day.capacityHours > 0 ? Math.min(100, Math.round((day.allocatedHours / day.capacityHours) * 100)) : 0;
          const over = day.allocatedHours > day.capacityHours + 0.05;
          return (
            <div
              key={day.date}
              className={cn(
                "rounded-xl border bg-cf-surface p-3 flex flex-col",
                day.isWorkDay ? "border-cf-border" : "border-cf-border/50 opacity-60"
              )}
            >
              <div className="text-xs font-semibold capitalize">{format(new Date(`${day.date}T00:00:00`), "EEEE", { locale: ptBR })}</div>
              <div className="text-[11px] text-cf-text-dim mb-2">{format(new Date(`${day.date}T00:00:00`), "dd/MM")}</div>
              {day.isWorkDay ? (
                <>
                  <Progress value={pct} indicatorClassName={over ? "bg-red-500" : undefined} className="mb-1" />
                  <div className={cn("text-[10px] mb-2", over ? "text-red-600 font-semibold" : "text-cf-text-dim")}>
                    {fmtHours(day.allocatedHours)} / {fmtHours(day.capacityHours)}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {day.items.length === 0 ? (
                      <div className="text-[11px] text-cf-text-dim/50">Livre</div>
                    ) : (
                      day.items.map((it, i) => (
                        <div key={i} className="rounded-md bg-cf-surface-2 px-2 py-1.5 text-[11px]">
                          <div className="font-medium truncate">{it.name}</div>
                          <div className="text-cf-text-dim truncate">
                            {it.projectName} · {fmtHours(it.hours)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-cf-text-dim/50 flex-1 flex items-center justify-center py-4">Folga</div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={apply}
        disabled={pending || applied}
        className="rounded-lg bg-cf-lime text-cf-on-accent font-semibold text-sm px-4 py-2 disabled:opacity-50 hover:brightness-95 transition"
      >
        {applied ? "Plano aplicado ✓" : pending ? "Aplicando..." : "Aplicar plano na minha carga de trabalho"}
      </button>
    </div>
  );
}
