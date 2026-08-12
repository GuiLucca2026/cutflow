import { listProjects } from "@/db/queries";
import { ProjectsExplorer } from "@/components/cutflow/projects-explorer";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const projects = await listProjects();

  const light = projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    priority: p.priority,
    client: p.client ? { id: p.client.id, name: p.client.name, color: p.client.color } : null,
    videos: p.videos.map((v: any) => ({
      status: v.status,
      finalDeadline: v.finalDeadline,
      editorId: v.editorId,
      editor: v.editor ? { name: v.editor.name, avatarColor: v.editor.avatarColor } : null,
    })),
  }));

  return (
    <div className="cf-fade-in space-y-5 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Projetos</h1>
        <p className="text-cf-text-dim text-sm">{projects.length} projetos ativos e arquivados</p>
      </div>
      <ProjectsExplorer projects={light} />
    </div>
  );
}
