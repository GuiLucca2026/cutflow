"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CalendarCheck2, Coffee, Flame, Sparkles } from "lucide-react";
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
        <div className="grid grid-cols-1 gap-3 border-b border-cf-border py-4 sm:grid-cols-2 xl:grid-cols-7">
          {days.map((day, index) => {
            const d = new Date(`${day.date}T00:00:00`);
            const pct = day.capacityHours > 0 ? Math.min(100, Math.round((day.allocatedHours / day.capacityHours) * 100)) : 0;
            const over = day.allocatedHours > day.capacityHours + 0.05;
            const today = index === 0;
            const intense = pct >= 85 && !over;
            const isEmpty = day.items.length === 0;
            const meta = describeDay(day, { today, over, intense, isEmpty });

            return (
              <div
                key={day.date}
                className={cn(
                  "group relative overflow-hidden rounded-[var(--cf-radius-card)] border p-3 transition-[transform,border-color] duration-[var(--cf-dur-hover)] hover:-translate-y-0.5",
                  meta.wrapper
                )}
                style={{ background: meta.background }}
                title={`${format(d, "EEEE", { locale: ptBR })}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px]" style={{ background: meta.accent }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.9]" style={{ background: meta.glow }} />

                <div className="relative flex h-full min-h-[190px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={cn("cf-micro", meta.dayLabel)}>{today ? "TODAY" : format(d, "EEE", { locale: ptBR }).toUpperCase()}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-cf-text-dim/80">{format(d, "dd/MM")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[28px] font-semibold leading-none tabular-nums text-cf-text">{format(d, "dd")}</div>
                      <div className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]", meta.badge)}>
                        <meta.Icon className="h-3 w-3" />
                        {meta.badgeLabel}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim">
                    <span>{day.isWorkDay ? "Carga" : "Status"}</span>
                    <span className={cn("tabular-nums", over ? "text-red-600" : intense ? "text-amber-700" : "text-cf-text-dim")}>{day.isWorkDay ? `${fmtHours(day.allocatedHours)}/${fmtHours(day.capacityHours)}` : "Folga"}</span>
                  </div>

                  <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full rounded-full transition-[width] duration-[var(--cf-dur-progress)] ease-[var(--cf-ease)]"
                      style={{ width: `${day.isWorkDay ? Math.max(pct, isEmpty ? 8 : 14) : 20}%`, background: meta.accent }}
                    />
                  </div>

                  <div className="mt-4 flex-1 space-y-2">
                    {!day.isWorkDay ? (
                      <div className="rounded-[10px] border border-black/5 bg-white/35 px-3 py-3 text-[12px] text-cf-text-dim">
                        Sem alocação. Dia fora da sua semana de trabalho.
                      </div>
                    ) : isEmpty ? (
                      <div className="rounded-[10px] border border-black/5 bg-white/52 px-3 py-3 text-[12px] text-cf-text-dim">
                        Janela livre para absorver alterações ou novas tarefas.
                      </div>
                    ) : (
                      day.items.slice(0, 3).map((it, i) => (
                        <div key={i} className="rounded-[10px] border border-black/5 bg-white/64 px-3 py-2.5 backdrop-blur-[1px]">
                          <div className="line-clamp-2 text-[12px] font-medium leading-[1.25] text-cf-text">{it.name}</div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-cf-text-dim">
                            <span className="truncate">{it.projectName}</span>
                            <span className="shrink-0 tabular-nums">{fmtHours(it.hours)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {day.isWorkDay && day.items.length > 3 ? (
                    <div className="mt-2 text-[11px] font-medium text-cf-text-dim">+{day.items.length - 3} itens</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function describeDay(
  day: PlanDay,
  { today, over, intense, isEmpty }: { today: boolean; over: boolean; intense: boolean; isEmpty: boolean }
) {
  if (!day.isWorkDay) {
    return {
      wrapper: "border-cf-border bg-cf-surface-2/80",
      background: "linear-gradient(180deg, rgba(241,238,232,.92), rgba(250,249,246,.74))",
      accent: "rgba(110,107,102,.45)",
      glow: "radial-gradient(circle at 82% 16%, rgba(255,255,255,.46), transparent 32%)",
      badge: "bg-white/68 text-cf-text-dim border border-black/5",
      badgeLabel: "Folga",
      dayLabel: "text-cf-text-dim/75",
      Icon: Coffee,
    };
  }
  if (today) {
    return {
      wrapper: "border-cf-primary/20",
      background: "linear-gradient(180deg, rgba(38,73,168,.09), rgba(255,255,255,.78))",
      accent: "var(--cf-primary)",
      glow: "radial-gradient(circle at 12% 10%, rgba(38,73,168,.14), transparent 34%), radial-gradient(circle at 86% 82%, rgba(157,183,223,.16), transparent 30%)",
      badge: "bg-cf-primary/10 text-cf-primary border border-cf-primary/12",
      badgeLabel: "Hoje",
      dayLabel: "text-cf-primary",
      Icon: Sparkles,
    };
  }
  if (over) {
    return {
      wrapper: "border-red-500/20",
      background: "linear-gradient(180deg, rgba(215,58,47,.11), rgba(255,255,255,.8))",
      accent: "var(--cf-red)",
      glow: "radial-gradient(circle at 88% 16%, rgba(215,58,47,.16), transparent 30%)",
      badge: "bg-red-500/10 text-red-600 border border-red-500/12",
      badgeLabel: "Excedido",
      dayLabel: "text-red-600",
      Icon: Flame,
    };
  }
  if (intense) {
    return {
      wrapper: "border-amber-500/20",
      background: "linear-gradient(180deg, rgba(245,163,87,.11), rgba(255,255,255,.8))",
      accent: "var(--cf-orange)",
      glow: "radial-gradient(circle at 88% 16%, rgba(245,163,87,.18), transparent 30%)",
      badge: "bg-amber-500/10 text-amber-700 border border-amber-500/12",
      badgeLabel: "Cheio",
      dayLabel: "text-amber-700",
      Icon: CalendarCheck2,
    };
  }
  if (isEmpty) {
    return {
      wrapper: "border-cf-border",
      background: "linear-gradient(180deg, rgba(31,138,76,.06), rgba(255,255,255,.8))",
      accent: "var(--cf-success)",
      glow: "radial-gradient(circle at 88% 16%, rgba(31,138,76,.12), transparent 30%)",
      badge: "bg-cf-success/10 text-cf-success border border-cf-success/12",
      badgeLabel: "Livre",
      dayLabel: "text-cf-text-dim",
      Icon: Check,
    };
  }
  return {
    wrapper: "border-cf-border",
    background: "linear-gradient(180deg, rgba(157,183,223,.08), rgba(255,255,255,.82))",
    accent: "var(--cf-primary)",
    glow: "radial-gradient(circle at 88% 16%, rgba(157,183,223,.18), transparent 32%)",
    badge: "bg-white/70 text-cf-primary border border-cf-primary/10",
    badgeLabel: "Planejado",
    dayLabel: "text-cf-text-dim",
    Icon: CalendarCheck2,
  };
}
