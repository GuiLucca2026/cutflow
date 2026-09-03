import { listVideos, listUsers, listClients, listWorkloadEntries, listCompletedChecklistLoad } from "@/db/queries";
import {
  computeOnTimeDelivery,
  computeMonthlyOnTime,
  computeRevisionStats,
  computeClientWaitTime,
  computeUtilization,
  computeChecklistLoadByPerson,
  computeChecklistLoadByStage,
} from "@/lib/analytics";
import { isProductionRole } from "@/lib/domain";
import { AnalyticsFilters } from "@/components/cutflow/analytics-filters";
import { fmtHours } from "@/lib/format";
import { subDays, format, startOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Repeat, Clock, Users2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/cutflow/page-header";

export const dynamic = "force-dynamic";

function dstr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string; clientId?: string; editorId?: string }> }) {
  const sp = await searchParams;
  const period = sp.period ?? "90";
  const clientId = sp.clientId ?? "";
  const editorId = sp.editorId ?? "";

  const now = new Date();
  const from = period === "all" ? subDays(now, 365 * 3) : subDays(now, Number(period));
  const fromISO = dstr(from);
  const toISO = dstr(now);

  const [videosRaw, users, clients] = await Promise.all([listVideos(), listUsers(), listClients()]);
  const workloadEntries = await listWorkloadEntries(fromISO, toISO);
  // listCompletedChecklistLoad precisa de timestamp completo (não
  // "yyyy-MM-dd" como fromISO/toISO acima) — ver o comentário na própria
  // query, em db/queries.ts.
  const checklistLoadRaw = await listCompletedChecklistLoad(from.toISOString(), now.toISOString());

  let videos = videosRaw.filter((v) => v.status !== "CANCELADO");
  if (clientId) videos = videos.filter((v) => v.project?.client?.id === clientId);
  if (editorId) videos = videos.filter((v) => v.editorId === editorId);

  // Mesmos filtros de cliente/editor que as outras métricas da página já
  // respeitam — ver os dois `if` acima.
  let checklistLoad = checklistLoadRaw;
  if (clientId) checklistLoad = checklistLoad.filter((i) => i.clientId === clientId);
  if (editorId) checklistLoad = checklistLoad.filter((i) => i.completedById === editorId);

  // On-time / revisões: escopo dentro do período selecionado (pelo prazo
  // original — quando o vídeo deveria ter sido entregue).
  const periodVideos = videos.filter((v) => {
    const d = new Date(v.originalFinalDeadline);
    return d >= from && d <= now;
  });

  const onTime = computeOnTimeDelivery(periodVideos);
  const revisions = computeRevisionStats(periodVideos);
  // Espera do cliente é sempre um retrato do AGORA — não faz sentido
  // filtrar por período, só por cliente/editor.
  const clientWait = computeClientWaitTime(videos);
  // Mesmo filtro de papel do Capacity Planning (ver isProductionRole em
  // lib/domain.ts) — Assistente não gera hora de edição, então não deveria
  // aparecer nem entrar no total de "Utilização da equipe" aqui.
  const productionUsers = users.filter((u) => isProductionRole(u.role));
  const filteredUsers = editorId ? productionUsers.filter((u) => u.id === editorId) : productionUsers;
  const utilization = computeUtilization(filteredUsers, workloadEntries, fromISO, toISO);
  // Carga REALIZADA (checklist concluído), separada de "Utilização" acima
  // (que é carga PLANEJADA em Planejar Semana) — ver o comentário no topo
  // de computeChecklistLoadByPerson, lib/analytics.ts.
  const checklistLoadByPerson = computeChecklistLoadByPerson(filteredUsers, checklistLoad);
  const checklistLoadByStage = computeChecklistLoadByStage(checklistLoad);

  // Tendência dos últimos 6 meses é sempre uma janela fixa, independente do
  // preset de período escolhido acima (que serve pros KPIs e rankings).
  const monthKeys = eachMonthOfInterval({ start: startOfMonth(subDays(now, 150)), end: now }).map((d) => format(d, "yyyy-MM"));
  const monthly = computeMonthlyOnTime(videos, monthKeys.slice(-6));
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.delivered));

  return (
    <div className="cf-fade-in space-y-6 pb-16">
      <PageHeader
        eyebrow="OVERVIEW / ANALYTICS"
        title="Analytics"
        subtitle="Entrega, revisão, espera do cliente, utilização e carga concluída — leitura de operação, não decoração."
        actions={<AnalyticsFilters clients={clients.map((c) => ({ id: c.id, name: c.name }))} editors={users.map((u) => ({ id: u.id, name: u.name }))} period={period} clientId={clientId} editorId={editorId} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <KpiCard
          label="Entrega no prazo"
          value={onTime.rate === null ? "—" : `${onTime.rate}%`}
          detail={`${onTime.onTime}/${onTime.delivered} entregues no prazo`}
          icon={CheckCircle2}
          tone={onTime.rate === null ? "default" : onTime.rate >= 80 ? "good" : onTime.rate >= 60 ? "warn" : "danger"}
        />
        <KpiCard
          label="Taxa de revisão"
          value={`${revisions.pctWithRevisions}%`}
          detail={`${revisions.avgPerVideo} revisões/vídeo em média`}
          icon={Repeat}
          tone={revisions.pctWithRevisions <= 40 ? "good" : revisions.pctWithRevisions <= 70 ? "warn" : "danger"}
        />
        <KpiCard
          label="Espera do cliente (agora)"
          value={clientWait.avgDays === null ? "—" : `${clientWait.avgDays}d`}
          detail={`${clientWait.count} vídeo${clientWait.count === 1 ? "" : "s"} aguardando · mediana ${clientWait.medianDays ?? "—"}d`}
          icon={Clock}
          tone={clientWait.avgDays === null ? "default" : clientWait.avgDays <= 2 ? "good" : clientWait.avgDays <= 5 ? "warn" : "danger"}
        />
        <KpiCard
          label="Utilização da equipe"
          value={utilization.companyPct === null ? "—" : `${utilization.companyPct}%`}
          detail={`${fmtHours(utilization.totalScheduled)} / ${fmtHours(utilization.totalCapacity)} no período`}
          icon={Users2}
          tone={utilization.companyPct === null ? "default" : utilization.companyPct > 100 ? "danger" : utilization.companyPct >= 70 ? "good" : "warn"}
        />
        <KpiCard
          label="Carga concluída"
          value={fmtHours(checklistLoadByPerson.totalHours)}
          detail={`${checklistLoadByPerson.totalCount} ${checklistLoadByPerson.totalCount === 1 ? "item" : "itens"} de checklist no período`}
          icon={ListChecks}
          tone="default"
        />
      </div>

      <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
        <h2 className="font-display text-xl tracking-wide mb-1">Entrega no prazo — últimos meses</h2>
        <p className="text-xs text-cf-text-dim mb-4">% de vídeos entregues até o prazo original combinado, por mês do prazo</p>
        {monthly.every((m) => m.delivered === 0) ? (
          <div className="text-sm text-cf-text-dim py-6 text-center">Sem entregas no período selecionado.</div>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {monthly.map((m) => {
              const barHeight = m.rate === null ? 0 : Math.max(2, Math.round((m.rate / 100) * 100));
              const barTone = m.rate === null ? "bg-cf-surface-2" : m.rate >= 80 ? "bg-cf-lime" : m.rate >= 60 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                  <div className="text-[11px] text-cf-text-dim">{m.rate === null ? "—" : `${m.rate}%`}</div>
                  <div className="w-full flex-1 flex items-end">
                    <div className={cn("w-full rounded-t transition-all", barTone)} style={{ height: `${barHeight}%` }} />
                  </div>
                  <div className="text-[10px] text-cf-text-dim capitalize">{format(new Date(`${m.month}-01T00:00:00`), "MMM/yy", { locale: ptBR })}</div>
                  <div className="text-[9px] text-cf-text-dim/60">{m.delivered} entrega{m.delivered === 1 ? "" : "s"}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
          <h2 className="font-display text-xl tracking-wide mb-1">Revisões por cliente</h2>
          <p className="text-xs text-cf-text-dim mb-4">Média de rodadas de revisão por vídeo, no período selecionado</p>
          {revisions.byClient.length === 0 ? (
            <div className="text-sm text-cf-text-dim py-6 text-center">Sem dados no período selecionado.</div>
          ) : (
            <div className="space-y-2.5">
              {revisions.byClient.map((c) => (
                <RankRow key={c.name} label={c.name} value={c.avg} maxValue={Math.max(...revisions.byClient.map((x) => x.avg), 1)} suffix=" rev." sub={`${c.count} vídeo${c.count === 1 ? "" : "s"}`} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
          <h2 className="font-display text-xl tracking-wide mb-1">Espera do cliente por cliente</h2>
          <p className="text-xs text-cf-text-dim mb-4">Dias aguardando resposta, agora — vídeos parados em "com o cliente"</p>
          {clientWait.byClient.length === 0 ? (
            <div className="text-sm text-cf-text-dim py-6 text-center">Nenhum vídeo aguardando cliente no momento.</div>
          ) : (
            <div className="space-y-2.5">
              {clientWait.byClient.map((c) => (
                <RankRow key={c.name} label={c.name} value={c.avgDays} maxValue={Math.max(...clientWait.byClient.map((x) => x.avgDays), 1)} suffix="d" sub={`${c.count} vídeo${c.count === 1 ? "" : "s"}`} tone={c.avgDays > 5 ? "danger" : c.avgDays > 2 ? "warn" : "good"} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
        <h2 className="font-display text-xl tracking-wide mb-1">Utilização por editor</h2>
        <p className="text-xs text-cf-text-dim mb-4">Horas agendadas vs. capacidade, no período selecionado</p>
        {utilization.byEditor.length === 0 ? (
          <div className="text-sm text-cf-text-dim py-6 text-center">Sem dados de capacidade no período selecionado.</div>
        ) : (
          <div className="space-y-2.5">
            {utilization.byEditor.map((e) => (
              <RankRow key={e.name} label={e.name} value={e.pct} maxValue={Math.max(...utilization.byEditor.map((x) => x.pct), 100)} suffix="%" sub={`${fmtHours(e.scheduled)} / ${fmtHours(e.capacity)}`} tone={e.pct > 100 ? "danger" : e.pct >= 70 ? "good" : "warn"} />
            ))}
          </div>
        )}
      </div>

      {/* Carga concluída (checklist) — diferente do bloco de Utilização
          acima (que é carga PLANEJADA em Planejar Semana): isto é carga
          REALIZADA, vinda de quem de fato marcou qual item do checklist
          como concluído, com a carga estipulada de cada item (ver
          lib/checklist.ts e a aba Checklist na ficha do vídeo). */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
          <h2 className="font-display text-xl tracking-wide mb-1">Carga concluída por pessoa</h2>
          <p className="text-xs text-cf-text-dim mb-4">Soma da carga estipulada dos itens de checklist que cada um concluiu, no período</p>
          {checklistLoadByPerson.byUser.length === 0 ? (
            <div className="text-sm text-cf-text-dim py-6 text-center">Nenhum item de checklist concluído no período selecionado.</div>
          ) : (
            <div className="space-y-2.5">
              {checklistLoadByPerson.byUser.map((u) => (
                <RankRow key={u.id} label={u.name} value={u.hours} maxValue={Math.max(...checklistLoadByPerson.byUser.map((x) => x.hours), 1)} suffix="h" sub={`${u.count} ${u.count === 1 ? "item" : "itens"}`} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
          <h2 className="font-display text-xl tracking-wide mb-1">Carga concluída por etapa</h2>
          <p className="text-xs text-cf-text-dim mb-4">Onde a carga da produtora está indo, por etapa do checklist</p>
          {checklistLoadByStage.length === 0 ? (
            <div className="text-sm text-cf-text-dim py-6 text-center">Nenhum item de checklist concluído no período selecionado.</div>
          ) : (
            <div className="space-y-2.5">
              {checklistLoadByStage.map((s) => (
                <RankRow key={s.label} label={s.label} value={s.hours} maxValue={Math.max(...checklistLoadByStage.map((x) => x.hours), 1)} suffix="h" sub={`${s.count} ${s.count === 1 ? "vídeo" : "vídeos"}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, detail, icon: Icon, tone = "default" }: { label: string; value: string; detail: string; icon: any; tone?: "default" | "danger" | "warn" | "good" }) {
  const toneMap = {
    default: "text-cf-text",
    danger: "text-red-600",
    warn: "text-amber-700",
    good: "text-cf-success",
  };
  return (
    <div className="border-t border-cf-border py-4">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("font-editorial text-[46px] leading-[0.82] tracking-[-0.035em]", toneMap[tone])}>{value}</div>
        <Icon className={cn("h-4 w-4", tone === "default" ? "text-cf-text-dim" : toneMap[tone])} />
      </div>
      <div className="cf-micro mt-3 text-cf-text-dim">{label}</div>
      <div className="mt-2 text-[11px] leading-relaxed text-cf-text-dim">{detail}</div>
    </div>
  );
}

function RankRow({
  label,
  value,
  maxValue,
  suffix,
  sub,
  tone = "default",
}: {
  label: string;
  value: number;
  maxValue: number;
  suffix: string;
  sub: string;
  tone?: "default" | "danger" | "warn" | "good";
}) {
  const pct = maxValue > 0 ? Math.min(100, Math.round((value / maxValue) * 100)) : 0;
  const barTone = tone === "danger" ? "bg-red-500" : tone === "warn" ? "bg-amber-500" : tone === "good" ? "bg-cf-lime" : "bg-cf-text-dim";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="truncate">{label}</span>
        <span className="text-cf-text-dim whitespace-nowrap ml-2">
          {value}
          {suffix} · {sub}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-cf-surface-2 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barTone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
