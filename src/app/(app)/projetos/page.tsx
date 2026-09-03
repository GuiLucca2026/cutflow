import { listProjects } from "@/db/queries";
import { ProjectsExplorer } from "@/components/cutflow/projects-explorer";
import { EditorialMasthead } from "@/components/cutflow/editorial-masthead";

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
      <EditorialMasthead
        eyebrow="WORK / PROJECTS"
        title="Projetos"
        accentTitle="em movimento."
        description="Do primeiro corte à entrega final — uma leitura visual do que está em fluxo agora."
        metric={projects.length}
        metricLabel="PROJECTS / TOTAL"
        className="mb-8"
      />

      <ProjectsExplorer projects={light} />
    </div>
  );
}
