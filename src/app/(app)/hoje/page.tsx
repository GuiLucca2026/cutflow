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
import { AlertTriangle, TriangleAlert, Info, Clock, Send, Scissors, CalendarClock } from "lucide-react";
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

      <div className="grid grid-cols-1 gap-3 border-b border-cf-border pb-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Atrasados"
          value={overdueMine.length}
          icon={AlertTriangle}
          tone={overdueMine.length > 0 ? "danger" : "default"}
          variant="danger"
          hint="Vídeos seus com o prazo final já vencido."
        />
        <StatCard
          label="Vence hoje"
          value={todayMine.length}
          icon={Send}
          tone={todayMine.length > 0 ? "good" : "default"}
          variant="today"
          hint="Prazo final ou revisão interna caem hoje."
        />
        <StatCard
          label="Editando"
          value={editingMine.length}
          icon={Scissors}
          tone={editingMine.length > 0 ? "good" : "default"}
          variant="editing"
          hint="Vídeos seus em edição ou alteração agora."
        />
        <StatCard
          label="Aguardando cliente"
          value={waitingMine.length}
          icon={Clock}
          tone="warn"
          variant="waiting"
          hint="Já mandou, esperando feedback ou aprovação do cliente."
        />
        <StatCard
          label="Horas hoje"
          value={fmtHours(planDays[0]?.allocatedHours ?? 0)}
          icon={CalendarClock}
          tone="default"
          variant="hours"
          hint="Sugestão do planejamento automático pra hoje, pela sua capacidade diária."
        />
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
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  variant = "default",
  href,
  hint,
}: {
  label: string;
  value: string | number;
  icon: any;
  tone?: "default" | "danger" | "warn" | "good";
  variant?: "default" | "danger" | "today" | "editing" | "waiting" | "hours";
  href?: string;
  hint?: string;
}) {
  const toneMap = {
    default: "text-cf-text",
    danger: "text-red-600",
    warn: "text-amber-700",
    good: "text-cf-success",
  } as const;

  const variantMap = {
    default: {
      accent: "bg-cf-border-strong",
      iconTint: "bg-cf-surface-2 text-cf-text-dim",
      valueTint: "text-cf-text",
      surface: "linear-gradient(180deg, rgba(255,255,255,.68), rgba(255,255,255,.4))",
      glaze: "linear-gradient(135deg, rgba(0,0,0,.02), transparent 52%)",
    },
    danger: {
      accent: "bg-red-500",
      iconTint: "bg-red-500/10 text-red-600",
      valueTint: "text-red-600",
      surface: "linear-gradient(180deg, rgba(215,58,47,.10), rgba(255,255,255,.72))",
      glaze: "radial-gradient(circle at 88% 12%, rgba(215,58,47,.16), transparent 36%)",
    },
    today: {
      accent: "bg-cf-primary",
      iconTint: "bg-cf-primary/10 text-cf-primary",
      valueTint: "text-cf-primary",
      surface: "linear-gradient(180deg, rgba(38,73,168,.08), rgba(255,255,255,.72))",
      glaze: "radial-gradient(circle at 88% 14%, rgba(38,73,168,.16), transparent 35%)",
    },
    editing: {
      accent: "bg-cf-success",
      iconTint: "bg-cf-success/10 text-cf-success",
      valueTint: "text-cf-success",
      surface: "linear-gradient(180deg, rgba(31,138,76,.09), rgba(255,255,255,.72))",
      glaze: "radial-gradient(circle at 88% 14%, rgba(31,138,76,.16), transparent 35%)",
    },
    waiting: {
      accent: "bg-cf-orange",
      iconTint: "bg-cf-orange/12 text-amber-700",
      valueTint: "text-amber-700",
      surface: "linear-gradient(180deg, rgba(245,163,87,.12), rgba(255,255,255,.72))",
      glaze: "radial-gradient(circle at 88% 14%, rgba(245,163,87,.18), transparent 35%)",
    },
    hours: {
      accent: "bg-cf-deep-blue",
      iconTint: "bg-cf-deep-blue/10 text-cf-deep-blue",
      valueTint: "text-cf-deep-blue",
      surface: "linear-gradient(180deg, rgba(17,27,103,.07), rgba(255,255,255,.72))",
      glaze: "radial-gradient(circle at 88% 12%, rgba(17,27,103,.12), transparent 35%)",
    },
  } as const;

  const style = variantMap[variant];
  const valueColor = variant !== "default" ? style.valueTint : toneMap[tone];

  const body = (
    <Hint text={hint}>
      <div
        className={cn(
          "group relative min-h-[118px] overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border p-4 transition-[transform,border-color,background-color] duration-[var(--cf-dur-hover)]",
          href && "hover:-translate-y-0.5 hover:border-black/15"
        )}
        style={{ background: style.surface }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: style.glaze }} />
        <div className={cn("absolute inset-x-0 top-0 h-[3px]", style.accent)} />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/5", style.iconTint)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className={cn("text-[42px] font-semibold tabular-nums leading-none tracking-[-0.045em] md:text-[48px]", valueColor)}>{value}</div>
          </div>

          <div className="mt-auto">
            <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-cf-text-dim">{label}</div>
            <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div className={cn("h-full rounded-full opacity-80", style.accent, value === 0 || value === "0h" ? "w-[18%]" : value === "8h" ? "w-[82%]" : "w-[54%]")} />
            </div>
          </div>
        </div>
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
