import { listVideos, listUsers, listWorkloadEntries, listCaptures, listNotifications, listMyTasks, listProjects } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { VideoCard } from "@/components/cutflow/video-card";
import { WaitingRow } from "@/components/cutflow/waiting-row";
import { Greeting } from "@/components/cutflow/greeting";
import { FlowMessage } from "@/components/cutflow/flow-message";
import { WeekPlanBoard } from "@/components/cutflow/week-plan-board";
import { ProjectStatusPreview } from "@/components/cutflow/project-status-preview";
import { planWeek } from "@/lib/planning";
import { computeAlerts } from "@/lib/alerts";
import { isOverdue, isWaitingClient, isDone, isEditing } from "@/lib/domain";
import { fmtDateFull, fmtHours } from "@/lib/format";
import { isToday, differenceInCalendarDays, addDays, format } from "date-fns";
import { AlertTriangle, TriangleAlert, Info, Clock, Send, Scissors, CalendarClock, type LucideIcon } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HojePage() {
  const user = await getCurrentUser();
  const [videos, users, captures, notifications, myTasks, projects] = await Promise.all([
    listVideos(),
    listUsers(),
    listCaptures(),
    listNotifications(user.id).catch(() => []),
    listMyTasks(user.id).catch(() => []),
    listProjects(),
  ]);
  const workloadEntries = await listWorkloadEntries(format(new Date(), "yyyy-MM-dd"), format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const alerts = computeAlerts({ videos, workloadEntries, users });

  const now = new Date();
  const firstName = user.name.split(" ")[0];
  const todayLabel = fmtDateFull(now);

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

  const planVideos = mine.map((v) => ({
    id: v.id,
    name: v.name,
    projectName: v.project?.name ?? "—",
    finalDeadline: v.finalDeadline,
    hoursRemaining: Math.max(0, v.estimatedHours - v.actualHours),
  }));
  const planDays = planWeek({ videos: planVideos, dailyCapacityHours: user.dailyCapacityHours, workDays: user.workDays, today: now, numDays: 7 });
  const totalAllocated = planDays.reduce((acc, d) => acc + d.allocatedHours, 0);

  const projectPreviews = projects
    .filter((project: any) => {
      const hasActiveVideo = project.videos.some((video: any) => !isDone(video.status));
      const isInEditingTeam = project.videos.some((video: any) => video.editorId === user.id && !isDone(video.status));
      return hasActiveVideo && (project.producerId === user.id || isInEditingTeam);
    })
    .sort((a: any, b: any) => {
      const deadlineA = a.videos.filter((video: any) => !isDone(video.status)).map((video: any) => video.finalDeadline).sort()[0] ?? "9999-12-31";
      const deadlineB = b.videos.filter((video: any) => !isDone(video.status)).map((video: any) => video.finalDeadline).sort()[0] ?? "9999-12-31";
      return deadlineA.localeCompare(deadlineB);
    })
    .slice(0, 3)
    .map((project: any) => ({
      id: project.id,
      name: project.name,
      type: project.type,
      priority: project.priority,
      status: project.status,
      client: project.client ? { id: project.client.id, name: project.client.name, color: project.client.color } : null,
      producer: project.producer ? { id: project.producer.id, name: project.producer.name, avatarColor: project.producer.avatarColor } : null,
      videos: project.videos.map((video: any) => ({
        status: video.status,
        finalDeadline: video.finalDeadline,
        editorId: video.editorId,
        editor: video.editor ? { name: video.editor.name, avatarColor: video.editor.avatarColor } : null,
        alterationStartedAt: video.alterationStartedAt,
      })),
    }));

  return (
    <div className="space-y-8 cf-fade-in pb-16">
      <header className="border-b border-cf-border pb-7 pt-[18px]">
        <div className="cf-micro text-cf-text-dim">TODAY / {todayLabel}</div>
        <Greeting firstName={firstName} className="font-editorial mt-3 text-[52px] leading-[0.92] tracking-[-0.035em] md:text-[68px]" />
        <FlowMessage work={flowWork} className="mt-4 max-w-2xl" />
      </header>

      {/* Assimetria de propósito (não é mais "5 caixas iguais"): Atrasados/
          Vence hoje só ganham peso visual de card quando há algo urgente de
          verdade (value > 0) — quando não há, colapsam pro mesmo formato
          inline dos outros três. Num dia calmo a faixa inteira vira uma
          linha de números, não uma parede de cards repetidos. */}
      <div className="flex flex-wrap items-stretch gap-x-6 gap-y-4 border-b border-cf-border pb-5">
        <HeroStat
          label="Atrasados"
          value={overdueMine.length}
          icon={AlertTriangle}
          urgent={overdueMine.length > 0}
          accent="#D73A2F"
          hint="Vídeos seus com o prazo final já vencido."
        />
        <HeroStat
          label="Vence hoje"
          value={todayMine.length}
          icon={Send}
          urgent={todayMine.length > 0}
          accent="var(--cf-primary)"
          hint="Prazo final ou revisão interna caem hoje."
        />
        <div className="flex flex-1 flex-wrap items-center gap-x-7 gap-y-3 self-center">
          <CompactStat
            label="Editando"
            value={editingMine.length}
            icon={Scissors}
            tone={editingMine.length > 0 ? "text-cf-success" : "text-cf-text-dim"}
            hint="Vídeos seus em edição ou alteração agora."
          />
          <CompactStat
            label="Aguardando cliente"
            value={waitingMine.length}
            icon={Clock}
            tone="text-amber-700"
            hint="Já mandou, esperando feedback ou aprovação do cliente."
          />
          <CompactStat
            label="Horas hoje"
            value={fmtHours(planDays[0]?.allocatedHours ?? 0)}
            icon={CalendarClock}
            tone="text-cf-text-dim"
            hint="Sugestão do planejamento automático pra hoje, pela sua capacidade diária."
          />
        </div>
      </div>

      <WeekPlanBoard
        days={planDays}
        unallocatedHours={Math.max(0, totalHoursLeftMine - totalAllocated)}
        totalHoursLeft={totalHoursLeftMine}
        dailyCapacityHours={user.dailyCapacityHours}
      />

      {projectPreviews.length > 0 ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4 border-b border-cf-border pb-3">
            <div>
              <div className="cf-micro text-cf-text-dim">PROJECT CONTEXT</div>
              <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.03em]">Projetos em movimento</h2>
              <p className="mt-1 text-xs text-cf-text-dim">Uma leitura rápida do avanço dos projetos em que você está trabalhando.</p>
            </div>
            <Link href="/projetos" className="shrink-0 text-xs font-medium text-cf-primary hover:underline">Ver todos →</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projectPreviews.map((project: any, index: number) => (
              <ProjectStatusPreview key={project.id} project={project} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {nothingToShow ? (
        <div className="border-b border-cf-border py-12 text-center">
          <div className="text-2xl font-semibold tracking-[-0.03em]">Fila limpa.</div>
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
                    "flex items-center gap-3 rounded-lg border bg-cf-surface px-3.5 py-2.5 hover:border-cf-primary/40 transition-colors",
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
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {alerts.map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className={cn(
                  "flex gap-2.5 rounded-xl border bg-cf-surface px-3.5 py-3 hover:border-cf-primary/40 transition-colors",
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
                  <div className="mt-0.5 text-xs leading-snug text-cf-text-dim">{a.detail}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}

function CompactStat({
  label,
  value,
  icon: Icon,
  tone = "text-cf-text-dim",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
  hint?: string;
}) {
  return (
    <Hint text={hint}>
      <div className="flex items-baseline gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", tone)} />
        <span className={cn("text-[22px] font-semibold tabular-nums leading-none tracking-[-0.02em]", tone)}>{value}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim">{label}</span>
      </div>
    </Hint>
  );
}

// Card "hero" só existe quando o número justifica peso visual (urgent=true).
// Quando não justifica, vira o mesmo CompactStat inline dos outros — a
// faixa toda respira em vez de forçar 2 caixas grandes vazias todo dia.
function HeroStat({
  label,
  value,
  icon: Icon,
  urgent,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  urgent: boolean;
  accent: string;
  hint?: string;
}) {
  if (!urgent) {
    return <CompactStat label={label} value={value} icon={Icon} hint={hint} />;
  }
  return (
    <Hint text={hint}>
      <div
        className="relative min-w-[168px] flex-1 overflow-hidden rounded-[var(--cf-radius-card)] border p-4 sm:flex-none sm:w-[212px]"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 32%, var(--cf-border))`,
          background: `color-mix(in srgb, ${accent} 7%, var(--cf-surface))`,
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
        <div className="flex items-center justify-between gap-3">
          <Icon className="h-4 w-4" style={{ color: accent }} />
          <div className="text-[44px] font-semibold tabular-nums leading-none tracking-[-0.045em]" style={{ color: accent }}>
            {value}
          </div>
        </div>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim">{label}</div>
      </div>
    </Hint>
  );
}

function Section({ title, subtitle, count, tone, children }: { title: string; subtitle?: string; count?: number; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2 border-b border-cf-border pb-2">
        <h2 className={cn("text-[26px] font-semibold tracking-[-0.03em]", tone === "danger" && "text-red-600")}>{title}</h2>
        {typeof count === "number" && <span className="text-sm font-semibold tabular-nums text-cf-text-dim">{count}</span>}
      </div>
      {subtitle && <p className="-mt-2 mb-3 text-xs text-cf-text-dim">{subtitle}</p>}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </Section>
  );
}

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
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cf-text-dim">
                {b.label} <span className="normal-case font-normal">· {b.items.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
