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
      <header className="mb-9 pt-2 md:mb-12">
        <div className="cf-micro text-cf-text-dim">WORK / PROJECTS</div>
        <div className="mt-4 grid items-end gap-8 border-b border-cf-border pb-7 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="max-w-[780px] leading-[0.88] tracking-[-0.055em]">
              <span className="block text-[54px] font-semibold md:text-[72px]">Projetos</span>
              <span className="font-editorial block text-[58px] font-normal md:text-[78px]">em movimento.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-cf-text-dim">
              Do primeiro corte à entrega final — uma leitura visual do que está em fluxo agora.
            </p>
          </div>
          <div className="hidden min-w-[120px] text-right sm:block">
            <div className="font-editorial text-[70px] leading-[0.72] tracking-[-0.045em] md:text-[86px]">{projects.length}</div>
            <div className="cf-micro mt-3 text-cf-text-dim">PROJECTS / TOTAL</div>
          </div>
        </div>
      </header>

      <ProjectsExplorer projects={light} />
    </div>
  );
}
