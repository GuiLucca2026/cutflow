import { notFound } from "next/navigation";
import { getProject, getProjectActivity } from "@/db/queries";
import { projectProgress, PRIORITY_META } from "@/lib/domain";
import { fmtDateTime, fmtCurrency } from "@/lib/format";
import { PriorityBadge } from "@/components/cutflow/badges";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { VideoCard } from "@/components/cutflow/video-card";
import { OpenVideoOnLoad } from "@/components/cutflow/open-video-on-load";
import { ProjectTabs } from "@/components/cutflow/project-tabs";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ video?: string }>;
}) {
  const { id } = await params;
  const { video } = await searchParams;
  const [project, activity] = await Promise.all([getProject(id), getProjectActivity(id)]);
  if (!project) notFound();

  const progress = projectProgress(project.videos);
  const editors = Array.from(
    new Map(project.videos.filter((v: any) => v.editorId).map((v: any) => [v.editorId, v.editor])).values()
  );

  return (
    <div className="cf-fade-in pb-16 space-y-5">
      {video && <OpenVideoOnLoad videoId={video} />}

      <div className="rounded-xl border border-cf-border bg-cf-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-cf-text-dim">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.client?.color }} />
              {project.client?.name}
              <span>·</span>
              {project.type}
            </div>
            <h1 className="font-display text-4xl tracking-wide mt-1">{project.name}</h1>
            {project.description && <p className="text-cf-text-dim text-sm mt-1 max-w-xl">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={project.priority} />
            {editors.length > 0 && <AvatarStack people={editors.map((e: any) => ({ name: e?.name ?? "?", color: e?.avatarColor }))} />}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <Fact label="Produtor" value={project.producer?.name ?? "—"} />
          <Fact label="Editor líder" value={project.leadEditor?.name ?? "—"} />
          <Fact label="Vídeos" value={String(project.videos.length)} />
          <Fact label="Orçamento" value={project.budget ? fmtCurrency(project.budget) : "—"} />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-cf-text-dim mb-1">
            <span>Progresso ponderado</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      <ProjectTabs project={project} activity={activity} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-cf-text-dim">{label}</div>
      <div className="font-medium text-sm mt-0.5">{value}</div>
    </div>
  );
}
