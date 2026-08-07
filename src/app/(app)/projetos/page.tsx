import Link from "next/link";
import { listProjects } from "@/db/queries";
import { projectProgress } from "@/lib/domain";
import { fmtDateWeekday, fmtCurrency } from "@/lib/format";
import { PriorityBadge } from "@/components/cutflow/badges";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { isOverdue } from "@/lib/domain";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const projects = await listProjects();

  return (
    <div className="cf-fade-in space-y-5 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Projetos</h1>
        <p className="text-cf-text-dim text-sm">{projects.length} projetos ativos e arquivados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {projects.map((p) => {
          const progress = projectProgress(p.videos);
          const overdue = isOverdue(p.deadline, p.status);
          const editors = Array.from(new Map(p.videos.filter((v) => v.editorId).map((v) => [v.editorId, v])).values());

          return (
            <Link
              key={p.id}
              href={`/projetos/${p.id}`}
              className={cn(
                "rounded-xl border bg-cf-surface p-4 hover:border-cf-lime/40 transition-colors",
                overdue ? "border-red-500/40" : "border-cf-border"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.client?.color }} />
                    <span className="text-xs text-cf-text-dim truncate">{p.client?.name}</span>
                  </div>
                  <h3 className="font-semibold mt-0.5 truncate">{p.name}</h3>
                  <div className="text-xs text-cf-text-dim mt-0.5">{p.type} · {p.videos.length} vídeos</div>
                </div>
                <PriorityBadge priority={p.priority} />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-cf-text-dim mb-1">
                  <span>Progresso</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-cf-border">
                <div className="text-xs text-cf-text-dim flex items-center gap-1">
                  {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                  <span className={overdue ? "text-red-400 font-semibold" : ""}>Prazo: {fmtDateWeekday(p.deadline)}</span>
                </div>
                {editors.length > 0 && (
                  <AvatarStack people={editors.map((v: any) => ({ name: v.editor?.name ?? "?", color: v.editor?.avatarColor }))} />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
