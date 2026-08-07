"use client";

import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { StatusBadge, PriorityBadge, RiskBadge } from "@/components/cutflow/badges";
import { Avatar } from "@/components/ui/avatar";
import { computeDeliveryRisk, isOverdue, STATUS_META } from "@/lib/domain";
import { fmtDateWeekday, fmtHours } from "@/lib/format";
import { Clock, AlertTriangle } from "lucide-react";
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
};

export function VideoCard({ video, showRisk = true, compact = false }: { video: VideoCardData; showRisk?: boolean; compact?: boolean }) {
  const { open } = useVideoDetail();
  const overdue = isOverdue(video.finalDeadline, video.status);
  const risk = computeDeliveryRisk(video);
  const statusColor = STATUS_META[video.status]?.color ?? "#6B7280";

  return (
    <button
      onClick={() => open(video.id)}
      style={{ borderLeft: `3px solid ${overdue ? "#DC2626" : statusColor}` }}
      className={cn(
        "w-full text-left rounded-xl border bg-cf-surface p-3.5 transition-all hover:border-cf-lime/40 cursor-pointer",
        overdue ? "border-red-500/40" : "border-cf-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{video.name}</div>
          <div className="text-xs text-cf-text-dim truncate">
            {video.project ? `${video.project.client?.name ?? "—"} · ${video.project.name}` : "Vídeo avulso · sem projeto"}
          </div>
        </div>
        {video.editor && <Avatar name={video.editor.name} color={video.editor.avatarColor} size={26} />}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <StatusBadge status={video.status} />
        <PriorityBadge priority={video.priority} />
        {showRisk && !["ENTREGUE", "ARQUIVADO", "CANCELADO"].includes(video.status) && <RiskBadge risk={risk} />}
      </div>

      {!compact && (
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-cf-border text-xs text-cf-text-dim">
          <span className={cn("flex items-center gap-1", overdue && "text-red-600 font-semibold")}>
            {overdue && <AlertTriangle className="h-3 w-3" />}
            Entrega: {fmtDateWeekday(video.finalDeadline)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {fmtHours(video.estimatedHours)}
          </span>
        </div>
      )}
    </button>
  );
}
