"use client";

import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { VideoContextMenu } from "@/components/cutflow/video-context-menu";
import { TeamStrip, type TeamMemberLite } from "@/components/cutflow/team-strip";
import { Avatar } from "@/components/ui/avatar";
import { Hint } from "@/components/ui/tooltip";
import {
  CLIENT_WAIT_ACCENT_COLOR,
  CLIENT_WAIT_META,
  PRIORITY_META,
  RISK_META,
  STATUS_META,
  computeClientWait,
  computeDeliveryRisk,
  isDone,
  isOverdue,
  isWaitingClient,
} from "@/lib/domain";
import { fmtDateWeekday, fmtHours, fmtShortId } from "@/lib/format";
import { AlertTriangle, Bell, CalendarDays, Clock3, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { atmosphericAccentForSeed } from "@/components/cutflow/atmospheric-gradient";

export type VideoCardData = {
  id: string;
  name: string;
  status: string;
  priority: string;
  finalDeadline: string;
  internalDeadline: string | null;
  estimatedHours: number;
  actualHours: number;
  revisionCount: number;
  editor: { name: string; avatarColor: string } | null;
  project: { name: string; client: { name: string; color: string } | null } | null;
  team?: TeamMemberLite[];
  clientSentAt?: string | null;
  updatedAt?: string | null;
  alterationStartedAt?: string | null;
  editorId?: string | null;
  projectId?: string | null;
  pendingCount?: number;
};

export function VideoCard({ video, showRisk = true, compact = false }: { video: VideoCardData; showRisk?: boolean; compact?: boolean }) {
  const { open } = useVideoDetail();
  const overdue = isOverdue(video.finalDeadline, video.status, video.alterationStartedAt);
  const risk = computeDeliveryRisk(video);
  const clientWait = computeClientWait(video);
  const statusMeta = STATUS_META[video.status] ?? { label: video.status, color: "#6B7280", hint: "" };
  const priorityMeta = PRIORITY_META[video.priority] ?? PRIORITY_META.NORMAL;
  const riskMeta = RISK_META[risk];
  const waitMeta = clientWait ? CLIENT_WAIT_META[clientWait.kind] : null;
  const accent = overdue ? "#C93128" : isWaitingClient(video.status) ? CLIENT_WAIT_ACCENT_COLOR : statusMeta.color;
  const projectSeed = video.projectId ?? video.project?.name ?? video.id;
  const projectAccent = atmosphericAccentForSeed(projectSeed);

  let attention: { label: string; color: string; hint?: string } | null = null;
  if (overdue) attention = { label: "ATRASADO", color: "#C93128", hint: "Passou da data de entrega final e o vídeo ainda não foi entregue." };
  else if (clientWait && waitMeta) attention = { label: clientWait.kind === "COBRAR_FEEDBACK" ? `${waitMeta.label} · ${clientWait.days}D` : waitMeta.label, color: waitMeta.color, hint: waitMeta.hint };
  else if (showRisk && !isDone(video.status) && risk !== "BAIXO") attention = { label: riskMeta.label, color: riskMeta.color, hint: riskMeta.hint };

  return (
    <VideoContextMenu video={video} onOpen={() => open(video.id)}>
      <button
        onClick={() => open(video.id)}
        className={cn(
          "group relative flex h-full min-h-[210px] w-full flex-col overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface text-left transition-[border-color,background-color] duration-[var(--cf-dur-hover)] hover:border-black/[0.22] hover:bg-white/70",
          overdue && "border-red-500/30"
        )}
      >
        <span className="absolute inset-x-0 top-0 h-[3px] opacity-80" style={{ background: projectAccent }} aria-hidden />
        <span className="absolute bottom-0 left-0 top-[3px] w-[3px]" style={{ backgroundColor: accent }} aria-hidden />

        <div className="px-4 pb-3 pt-[18px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {video.project ? (
                <div className="flex min-w-0 items-center gap-2">
                  {video.project.client?.color ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: video.project.client.color }} /> : null}
                  <span className="cf-micro truncate text-cf-text-dim">{video.project.client?.name ?? "SEM CLIENTE"}</span>
                </div>
              ) : (
                <span className="cf-micro text-amber-700">AVULSO / SEM PROJETO</span>
              )}
              {video.project ? <div className="mt-1 truncate text-[12px] text-cf-text-dim">{video.project.name}</div> : null}
            </div>

            <div className="shrink-0 text-right">
              <div className="font-mono text-[9px] tracking-[0.12em] text-cf-text-dim/65">CUT / {fmtShortId(video.id).toUpperCase()}</div>
              {!!video.pendingCount && (
                <Hint text={`${video.pendingCount} ${video.pendingCount === 1 ? "notificação não lida" : "notificações não lidas"} neste vídeo`}>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-cf-primary">
                    <Bell className="h-3 w-3" /> {video.pendingCount}
                  </span>
                </Hint>
              )}
            </div>
          </div>

          <h3 className="mt-4 line-clamp-2 min-h-[42px] text-[16px] font-semibold leading-[1.18] tracking-[-0.025em] text-cf-text group-hover:text-cf-primary">
            {video.name}
          </h3>
        </div>

        <div className="border-y border-cf-border bg-cf-surface-2/55 px-4 py-2.5">
          <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <Hint text={statusMeta.hint}>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-cf-text">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusMeta.color }} />
                {statusMeta.label}
              </span>
            </Hint>

            <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.08em]">
              {video.priority !== "NORMAL" ? (
                <Hint text={priorityMeta.hint}><span style={{ color: priorityMeta.color }}>{priorityMeta.label}</span></Hint>
              ) : null}
              {attention ? (
                <Hint text={attention.hint}>
                  <span className="inline-flex items-center gap-1" style={{ color: attention.color }}>
                    {overdue ? <AlertTriangle className="h-3 w-3" /> : null}{attention.label}
                  </span>
                </Hint>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
          <div className="flex items-center gap-2">
            {video.editor ? (
              <>
                <Avatar name={video.editor.name} color={video.editor.avatarColor} size={20} />
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-cf-text-dim/75">Responsável</div>
                  <div className="truncate text-xs font-medium text-cf-text">{video.editor.name}</div>
                </div>
              </>
            ) : (
              <Hint text="Nenhum editor foi definido para este vídeo ainda — ele não está na fila de ninguém.">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"><UserX className="h-3.5 w-3.5" /> Sem responsável</span>
              </Hint>
            )}
            <span className="ml-auto shrink-0"><TeamStrip team={video.team} size={16} /></span>
          </div>

          {!compact && (
            <div className="mt-auto grid grid-cols-2 gap-4 border-t border-cf-border pt-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-cf-text-dim/75"><CalendarDays className="h-3 w-3" /> Entrega</div>
                <Hint text={overdue ? "Passou da data de entrega final e o vídeo ainda não foi entregue." : undefined}>
                  <span className={cn("mt-1 block truncate text-xs font-medium text-cf-text", overdue && "text-red-600")}>{fmtDateWeekday(video.finalDeadline)}</span>
                </Hint>
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center justify-end gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-cf-text-dim/75"><Clock3 className="h-3 w-3" /> Estimativa</div>
                <div className="mt-1 text-xs font-medium tabular-nums text-cf-text">{fmtHours(video.estimatedHours)}</div>
              </div>
            </div>
          )}
        </div>
      </button>
    </VideoContextMenu>
  );
}
