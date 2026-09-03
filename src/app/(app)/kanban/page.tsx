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
    alterationStartedAt: v.alterationStartedAt,
    editor: v.editor ? { name: v.editor.name, avatarColor: v.editor.avatarColor } : null,
    project: v.project ? { name: v.project.name, client: v.project.client ? { name: v.project.client.name, color: v.project.client.color } : null } : null,
  }));

  return (
    <div className="cf-fade-in flex h-full flex-col">
      <header className="mb-7 border-b border-cf-border pb-6 pt-2">
        <div className="cf-micro text-cf-text-dim">WORK / STATUS FLOW</div>
        <h1 className="mt-3 text-[54px] font-semibold leading-[0.9] tracking-[-0.055em] md:text-[68px]">Kanban<span className="font-editorial font-normal">.</span></h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cf-text-dim">Arraste os cortes entre estados. O movimento muda o status; o histórico continua registrando cada transição.</p>
      </header>
      <KanbanBoard initialVideos={light} />
    </div>
  );
}
