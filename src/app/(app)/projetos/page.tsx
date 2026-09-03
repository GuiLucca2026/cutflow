import { listProjects } from "@/db/queries";
import { ProjectsExplorer } from "@/components/cutflow/projects-explorer";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const projects = await listProjects();

  const light = projects.map((project: any) => ({
    id: project.id,
    name: project.name,
    type: project.type,
    priority: project.priority,
    status: project.status,
    client: project.client
      ? { id: project.client.id, name: project.client.name, color: project.client.color }
      : null,
    producer: project.producer
      ? { id: project.producer.id, name: project.producer.name, avatarColor: project.producer.avatarColor }
      : null,
    videos: project.videos.map((video: any) => ({
      status: video.status,
      finalDeadline: video.finalDeadline,
      editorId: video.editorId,
      editor: video.editor ? { name: video.editor.name, avatarColor: video.editor.avatarColor } : null,
      alterationStartedAt: video.alterationStartedAt,
    })),
  }));

  return (
    <div className="cf-fade-in pb-20">
      <header className="mb-8 pt-1 md:mb-10">
        <div className="cf-micro text-cf-text-dim">WORK / PROJECTS</div>
        <div className="mt-3 flex items-end justify-between gap-6 border-b border-cf-border pb-5">
          <div>
            <h1 className="text-[46px] font-semibold leading-none tracking-[-0.045em] md:text-[62px]">Projetos</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cf-text-dim">
              Uma visão visual do que está em movimento agora — do primeiro corte até a entrega.
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="font-editorial text-[58px] leading-[0.8] tracking-[-0.04em] md:text-[72px]">{projects.length}</div>
            <div className="cf-micro mt-2 text-cf-text-dim">PROJECTS</div>
          </div>
        </div>
      </header>

      <ProjectsExplorer projects={light} />
    </div>
  );
}
