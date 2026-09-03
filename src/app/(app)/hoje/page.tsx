import { listVideos, listUsers, listWorkloadEntries, listCaptures, listNotifications, listMyTasks } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { VideoCard } from "@/components/cutflow/video-card";
import { WaitingRow } from "@/components/cutflow/waiting-row";
import { Greeting } from "@/components/cutflow/greeting";
import { FlowMessage } from "@/components/cutflow/flow-message";
import { WeekPlanBoard } from "@/components/cutflow/week-plan-board";
import { planWeek } from "@/lib/planning";
import { computeAlerts } from "@/lib/alerts";
import { isOverdue, isWaitingClient, isDone, isEditing } from "@/lib/domain";
import { fmtDateFull, fmtHours } from "@/lib/format";
import { isToday, differenceInCalendarDays, addDays, format } from "date-fns";
import { AlertTriangle, TriangleAlert, Info, Clock, Send, Scissors, CalendarClock } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Meu Dia — antes eram 3 páginas separadas (Hoje, Minha Edição, Planejar
// Semana), cada uma respondendo um pedaço de "o que eu preciso fazer" sem
// as outras duas. Consolidado numa página só por decisão de produto (ver
// auditoria de UX): "Hoje" também tinha um problema de nome — mostrava a
// produtora inteira, não a fila pessoal de quem estava logado, o que
// confundia quem chegava de primeira. Agora a página é pessoal de
// verdade; visão da produtora inteira continua existindo em Panorama.
// "Conflitos & Riscos" (calculado pelo sistema, não pessoal) foi mantido
// abaixo do bloco pessoal — ainda é informação operacional que vale
// qualquer um ver, só não é mais o que abre a tela.
export default async function HojePage() {
  const user = await getCurrentUser();
  const [videos, users, captures, notifications, myTasks] = await Promise.all([
    listVideos(),
    listUsers(),
    listCaptures(),
    listNotifications(user.id).catch(() => []),
    listMyTasks(user.id).catch(() => []),
  ]);
  const workloadEntries = await listWorkloadEntries(format(new Date(), "yyyy-MM-dd"), format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const alerts = computeAlerts({ videos, workloadEntries, users });

  const now = new Date();
  const firstName = user.name.split(" ")[0];
  const todayLabel = fmtDateFull(now);

  // ---------------------------------------------------------------------
  // Recorte pessoal (era Minha Edição) — só vídeos do usuário logado.
  // ---------------------------------------------------------------------
  const mine = videos.filter((v) => v.editorId === user.id && !isDone(v.status));
  const overdueMine = mine.filter((v) => isOverdue(v.finalDeadline, v.status, v.alterationStartedAt));
  const todayMine = mine.filter((v) => isToday(new Date(v.finalDeadline)) || isToday(new Date(v.internalDeadline ?? v.finalDeadline)));
  const editingMine = mine.filter((v) => isEditing(v.status));
  const waitingMine = mine.filter((v) => isWaitingClient(v.status));
  const thisWeekMine = mine.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), now);
    return d > 0 && d <= 7;
  });
  const nextMine = mine.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), now);
    return d > 7;
  });
  const nothingToShow =
    overdueMine.length + todayMine.length + waitingMine.length + thisWeekMine.length + nextMine.length === 0 && myTasks.length === 0;
  const totalHoursLeftMine = mine.reduce((acc, v) => acc + Math.max(0, v.estimatedHours - v.actualHours), 0);

  // Notificações não lidas por vídeo (Fase 12) — vira o selo de sino no
  // VideoCard, só aqui por ora (ver o comentário em video-card.tsx).
  const unreadByVideo = new Map<string, number>();
  for (const n of notifications) {
    if (!n.read && n.entityType === "VIDEO" && n.entityId) unreadByVideo.set(n.entityId, (unreadByVideo.get(n.entityId) ?? 0) + 1);
  }
  function withPending<T extends { id: string }>(list: T[]): (T & { pendingCount?: number })[] {
    return list.map((v) => ({ ...v, pendingCount: unreadByVideo.get(v.id) }));
  }

  const flowWork = {
    videos: videos.map((v) => ({ status: v.status, finalDeadline: v.finalDeadline, updatedAt: v.updatedAt, alterationStartedAt: v.alterationStartedAt })),
    captures: captures.map((c) => ({ status: c.status, date: c.date })),
  };

  // ---------------------------------------------------------------------
  // Planejar Semana (era página própria) — mesma lógica de sempre
  // (Backward Planning + Auto Schedule), ver lib/planning.ts.
  // ---------------------------------------------------------------------
  const planVideos = mine.map((v) => ({
    id: v.id,
    name: v.name,
    projectName: v.project?.name ?? "—",
    finalDeadline: v.finalDeadline,
    hoursRemaining: Math.max(0, v.estimatedHours - v.actualHours),
  }));
  const planDays = planWeek({ videos: planVideos, dailyCapacityHours: user.dailyCapacityHours, workDays: user.workDays, today: now, numDays: 7 });
  const totalAllocated = planDays.reduce((acc, d) => acc + d.allocatedHours, 0);

  return (
    <div className="space-y-10 cf-fade-in pb-16">
      <header className="border-b border-cf-border pb-7 pt-2">
        <div className="cf-micro text-cf-text-dim">TODAY / {todayLabel}</div>
        <Greeting firstName={firstName} className="font-editorial mt-3 text-[54px] leading-[0.92] tracking-[-0.035em] md:text-[72px]" />
        <FlowMessage work={flowWork} className="mt-4 max-w-2xl" />
      </header>

      {/* Cada card responde uma pergunta específica de "o que eu faço agora"
          — antes tinha "Hoje" sem dizer o que contava, "Tarefas
          atribuídas" (0 quase sempre, e a lista completa já existe embaixo
          em #minhas-tarefas) e "Horas restantes" somando TODO vídeo ativo
          (inclusive um que só vence daqui a 3 semanas — número grande e
          pouco acionável). Trocado por "Horas hoje", que é o que o
          planejamento automático (faixa "Sua semana", no topo) sugere pra hoje
          especificamente. */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-cf-border pb-2 md:grid-cols-5">
        <StatCard
          label="Atrasados"
          value={overdueMine.length}
          icon={AlertTriangle}
          tone={overdueMine.length > 0 ? "danger" : "default"}
          hint="Vídeos seus com o prazo final já vencido."
        />
        <StatCard
          label="Vence hoje"
          value={todayMine.length}
          icon={Send}
          tone={todayMine.length > 0 ? "good" : "default"}
          hint="Prazo final ou revisão interna caem hoje."
        />
        <StatCard
          label="Editando"
          value={editingMine.length}
          icon={Scissors}
          tone={editingMine.length > 0 ? "good" : "default"}
          hint="Vídeos seus em edição ou alteração agora."
        />
        <StatCard
          label="Aguardando cliente"
          value={waitingMine.length}
          icon={Clock}
          tone="warn"
          hint="Já mandou, esperando feedback ou aprovação do cliente."
        />
        <StatCard
          label="Horas hoje"
          value={fmtHours(planDays[0]?.allocatedHours ?? 0)}
          icon={CalendarClock}
          tone="default"
          hint="Sugestão do planejamento automático pra hoje, pela sua capacidade diária."
        />
      </div>

      <WeekPlanBoard
        days={planDays}
        unallocatedHours={Math.max(0, totalHoursLeftMine - totalAllocated)}
        totalHoursLeft={totalHoursLeftMine}
        dailyCapacityHours={user.dailyCapacityHours}
      />

      {/* Seções só aparecem quando têm conteúdo — os cards acima já dizem
          "0". Antes cada uma vazia virava uma caixa tracejada gigante com
          "Nada aqui", e num dia tranquilo a página era uma pilha de 5
          caixas vazias (o principal sinal de "amador" apontado pelo
          usuário). Se TUDO estiver vazio, um único aviso, embaixo. */}
      {nothingToShow ? (
        <div className="border-b border-cf-border py-12 text-center">
          <div className="font-editorial text-3xl">Fila limpa.</div>
          <p className="mt-2 text-sm text-cf-text-dim">Nenhum vídeo atribuído a você precisa de atenção agora.</p>
        </div>
      ) : null}

      {overdueMine.length > 0 && <Group title="Atrasados" videos={withPending(overdueMine)} tone="danger" />}
      {todayMine.length > 0 && <Group title="Vence hoje" videos={withPending(todayMine)} />}

      {waitingMine.length > 0 && (
        <Section title="Aguardando cliente" subtitle="Tempo parado esperando retorno" count={waitingMine.length}>
          <div className="space-y-2">
            {waitingMine.map((v) => (
              <WaitingRow key={v.id} video={v} />
            ))}
          </div>
        </Section>
      )}

      {myTasks.length > 0 && (
      <Section title="Minhas tarefas" subtitle="Atribuídas a você, de qualquer projeto ou vídeo" count={myTasks.length}>
        {(
          <div id="minhas-tarefas" className="space-y-1.5">
            {myTasks.map((t: any) => {
              const overdue = t.dueAt && new Date(t.dueAt).getTime() < now.getTime();
              const contextHref = t.video ? `/projetos/${t.video.projectId}?video=${t.video.id}` : t.project ? `/projetos/${t.project.id}` : undefined;
              return (
                <Link
                  key={t.id}
                  href={contextHref ?? "#"}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-cf-surface px-3.5 py-2.5 hover:border-cf-lime/40 transition-colors",
                    overdue ? "border-red-500/30" : "border-cf-border"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-cf-text-dim truncate">{t.video?.name ?? t.project?.name ?? "—"}</div>
                  </div>
                  {t.dueAt && (
                    <span className={cn("text-xs whitespace-nowrap", overdue ? "text-red-600 font-semibold" : "text-cf-text-dim")}>
                      {new Date(t.dueAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </Section>
      )}

      {thisWeekMine.length > 0 && <GroupedByStatus title="Esta semana" videos={withPending(thisWeekMine)} />}
      {nextMine.length > 0 && <Group title="Próximo" videos={withPending(nextMine)} />}

      {alerts.length > 0 && (
        <Section title="Conflitos & Riscos" subtitle="Detectado automaticamente — colisões de agenda, sobrecarga e risco de prazo (produtora inteira)" count={alerts.length} tone="danger">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {alerts.map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className={cn(
                  "flex gap-2.5 rounded-xl border bg-cf-surface px-3.5 py-3 hover:border-cf-lime/40 transition-colors",
                  a.severity === "CRITICO" ? "border-red-500/30" : a.severity === "ALTO" ? "border-amber-500/30" : "border-cf-border"
                )}
              >
                {a.severity === "CRITICO" ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                ) : a.severity === "ALTO" ? (
                  <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                ) : (
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-cf-text-dim" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-snug">{a.title}</div>
                  <div className="text-xs text-cf-text-dim leading-snug mt-0.5">{a.detail}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = "default", href, hint }: { label: string; value: string | number; icon: any; tone?: "default" | "danger" | "warn" | "good"; href?: string; hint?: string }) {
  const toneMap = {
    default: "text-cf-text",
    danger: "text-red-600",
    warn: "text-amber-700",
    good: "text-cf-success",
  };
  const body = (
    <Hint text={hint}>
      <div className={cn("group border-t border-cf-border py-4 transition-colors", href && "hover:border-cf-primary")}>
        <div className="flex items-start justify-between gap-3">
          <div className={cn("font-editorial text-[48px] leading-[0.78] tracking-[-0.035em] md:text-[56px]", toneMap[tone])}>{value}</div>
          <Icon className={cn("h-4 w-4", tone === "default" ? "text-cf-text-dim" : toneMap[tone])} />
        </div>
        <div className="cf-micro mt-3 text-cf-text-dim">{label}</div>
      </div>
    </Hint>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Section({ title, subtitle, count, tone, children }: { title: string; subtitle?: string; count?: number; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2 border-b border-cf-border pb-2">
        <h2 className={cn("text-[26px] font-semibold tracking-[-0.03em]", tone === "danger" && "text-red-600")}>{title}</h2>
        {typeof count === "number" && <span className="font-editorial text-xl text-cf-text-dim">{count}</span>}
      </div>
      {subtitle && <p className="text-xs text-cf-text-dim -mt-2 mb-3">{subtitle}</p>}
      {children}
    </section>
  );
}

function Group({ title, videos, emptyText, tone }: { title: string; videos: any[]; emptyText?: string; tone?: "danger" }) {
  return (
    <Section title={title} count={videos.length} tone={tone}>
      {videos.length === 0 ? (
        <EmptyState text={emptyText ?? "Nada aqui."} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </Section>
  );
}

// Igual ao Group acima, mas em vez de uma grade única, separa por "o que
// esse vídeo precisa de mim agora" — pedido explícito do usuário: uma
// visão de tudo que está em edição e outra do que está parado com o
// cliente (esses dois status foram unidos, ver STATUS_META em
// lib/domain.ts), em vez de uma lista só ordenada por prazo. O resto
// (fila, revisão interna, alteração ainda não iniciada, pós-aprovação)
// cai no terceiro bloco — não tem ação de edição pendente nem está
// bloqueado pelo cliente, então não precisa de destaque próprio.
function GroupedByStatus({ title, videos, emptyText }: { title: string; videos: any[]; emptyText?: string }) {
  const editing = videos.filter((v) => isEditing(v.status));
  const withClient = videos.filter((v) => isWaitingClient(v.status));
  const rest = videos.filter((v) => !isEditing(v.status) && !isWaitingClient(v.status));

  const buckets = [
    { label: "Editando", items: editing },
    { label: "Com o cliente", items: withClient },
    { label: "Fila e revisão", items: rest },
  ].filter((b) => b.items.length > 0);

  return (
    <Section title={title} count={videos.length}>
      {videos.length === 0 ? (
        <EmptyState text={emptyText ?? "Nada aqui."} />
      ) : (
        <div className="space-y-5">
          {buckets.map((b) => (
            <div key={b.label}>
              <div className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim mb-2">
                {b.label} <span className="normal-case font-normal">· {b.items.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {b.items.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-cf-border p-6 text-center text-sm text-cf-text-dim">{text}</div>;
}


