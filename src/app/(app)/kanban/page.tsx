import { listVideos } from "@/db/queries";
import { KanbanBoard } from "@/components/cutflow/kanban-board";
import { EditorialMasthead } from "@/components/cutflow/editorial-masthead";

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
    alterationStartedAt: v.alterationStartedAt,
    editor: v.editor ? { name: v.editor.name, avatarColor: v.editor.avatarColor } : null,
    project: v.project ? { name: v.project.name, client: v.project.client ? { name: v.project.client.name, color: v.project.client.color } : null } : null,
  }));

  return (
    <div className="cf-fade-in flex h-full flex-col">
      <EditorialMasthead
        eyebrow="WORK / STATUS FLOW"
        title="Kanban"
        accentTitle="."
        description="Arraste os cortes entre estados. O movimento muda o status; o histórico continua registrando cada transição."
        className="mb-7"
      />
      <KanbanBoard initialVideos={light} />
    </div>
  );
}
