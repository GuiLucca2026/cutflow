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
import { AlertTriangle, Bell, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <VideoContextMenu video={video} onOpen={() => open(video.id)}>
      <button
        onClick={() => open(video.id)}
        className={cn(
          "group relative flex h-full min-h-[224px] w-full flex-col overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface p-4 text-left transition-colors duration-[var(--cf-dur-hover)] hover:border-black/[0.22]",
          overdue && "border-red-500/25"
        )}
      >
        <span className="absolute bottom-0 left-0 top-0 w-[2px]" style={{ backgroundColor: accent }} aria-hidden />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {video.project ? (
              <div className="flex min-w-0 items-center gap-1.5">
                {video.project.client?.color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: video.project.client.color }} />}
                <span className="cf-micro truncate text-cf-text-dim">{video.project.client?.name ?? "—"}</span>
              </div>
            ) : (
              <span className="cf-micro text-amber-700">AVULSO / SEM PROJETO</span>
            )}
            {video.project && <div className="mt-1 truncate text-[11px] text-cf-text-dim">{video.project.name}</div>}
          </div>

          <div className="shrink-0 text-right">
            <div className="font-mono text-[9px] tracking-[0.12em] text-cf-text-dim/65">CUT / {fmtShortId(video.id).toUpperCase()}</div>
            {!!video.pendingCount && (
              <Hint text={`${video.pendingCount} ${video.pendingCount === 1 ? "notificação não lida" : "notificações não lidas"} neste vídeo`}>
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-cf-primary">
                  <Bell className="h-2.5 w-2.5" /> {video.pendingCount}
                </span>
              </Hint>
            )}
          </div>
        </div>

        <div className="mt-4 min-h-[44px]">
          <div className="text-[16px] font-semibold leading-[1.08] tracking-[-0.025em] group-hover:text-cf-primary">
            {video.name}
          </div>
        </div>

        <div className="mt-4 min-h-[28px] flex flex-wrap items-start gap-x-2 gap-y-1 cf-micro">
          <Hint text={statusMeta.hint}>
            <span style={{ color: statusMeta.color }}>{statusMeta.label}</span>
          </Hint>
          {video.priority !== "NORMAL" && (
            <><span className="text-cf-text-dim/50">·</span><Hint text={priorityMeta.hint}><span style={{ color: priorityMeta.color }}>{priorityMeta.label}</span></Hint></>
          )}
          {overdue && <><span className="text-cf-text-dim/50">·</span><span className="text-red-600">● ATRASADO</span></>}
          {!overdue && clientWait && waitMeta && (
            <><span className="text-cf-text-dim/50">·</span><Hint text={waitMeta.hint}><span style={{ color: waitMeta.color }}>{waitMeta.label}{clientWait.kind === "COBRAR_FEEDBACK" ? ` / ${clientWait.days}D` : ""}</span></Hint></>
          )}
          {!overdue && !clientWait && showRisk && !isDone(video.status) && risk !== "BAIXO" && (
            <><span className="text-cf-text-dim/50">·</span><Hint text={riskMeta.hint}><span style={{ color: riskMeta.color }}>● {riskMeta.label}</span></Hint></>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-cf-border pt-3">
          {video.editor ? (
            <>
              <Avatar name={video.editor.name} color={video.editor.avatarColor} size={18} />
              <span className="min-w-0 truncate text-xs text-cf-text-dim">{video.editor.name}</span>
            </>
          ) : (
            <Hint text="Nenhum editor foi definido para este vídeo ainda — ele não está na fila de ninguém.">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><UserX className="h-3.5 w-3.5" /> Sem responsável</span>
            </Hint>
          )}
          <span className="ml-auto shrink-0"><TeamStrip team={video.team} size={16} /></span>
        </div>

        {!compact && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-cf-text-dim">
            <div>
              <div className="cf-micro opacity-70">DELIVERY</div>
              <Hint text={overdue ? "Passou da data de entrega final e o vídeo ainda não foi entregue." : undefined}>
                <span className={cn("mt-1 flex items-center gap-1", overdue && "font-semibold text-red-600")}>
                  {overdue && <AlertTriangle className="h-3 w-3" />}{fmtDateWeekday(video.finalDeadline)}
                </span>
              </Hint>
            </div>
            <div className="text-right">
              <div className="cf-micro opacity-70">ESTIMATE</div>
              <div className="mt-1">{fmtHours(video.estimatedHours)}</div>
            </div>
          </div>
        )}
      </button>
    </VideoContextMenu>
  );
}
