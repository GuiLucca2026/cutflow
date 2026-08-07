import { listVideos } from "@/db/queries";
import { KanbanBoard } from "@/components/cutflow/kanban-board";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const videos = await listVideos();

  const light = videos.map((v) => ({
    id: v.id,
    name: v.name,
    status: v.status,
    priority: v.priority,
    finalDeadline: v.finalDeadline,
    internalDeadline: v.internalDeadline,
    estimatedHours: v.estimatedHours,
    actualHours: v.actualHours,
    revisionCount: v.revisionCount,
    editor: v.editor ? { name: v.editor.name, avatarColor: v.editor.avatarColor } : null,
    project: v.project ? { name: v.project.name, client: v.project.client ? { name: v.project.client.name, color: v.project.client.color } : null } : null,
  }));

  return (
    <div className="cf-fade-in h-full flex flex-col">
      <div className="mb-5">
        <h1 className="font-display text-4xl tracking-wide">Kanban</h1>
        <p className="text-cf-text-dim text-sm">Arraste os cards entre as colunas para atualizar o status. Cada movimento é registrado no histórico.</p>
      </div>
      <KanbanBoard initialVideos={light} />
    </div>
  );
}
