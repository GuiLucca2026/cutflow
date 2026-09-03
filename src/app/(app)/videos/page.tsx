import { listVideos, listUsers, listClients } from "@/db/queries";
import { VideosExplorer } from "@/components/cutflow/videos-explorer";
import { EditorialMasthead } from "@/components/cutflow/editorial-masthead";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const [videos, users, clients] = await Promise.all([listVideos(), listUsers(), listClients()]);

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
    editorId: v.editorId,
    clientId: v.project?.client?.id,
    editor: v.editor ? { name: v.editor.name, avatarColor: v.editor.avatarColor } : null,
    project: v.project ? { name: v.project.name, client: v.project.client ? { name: v.project.client.name, color: v.project.client.color } : null } : null,
  }));

  return (
    <div className="cf-fade-in pb-16">
      <EditorialMasthead
        eyebrow="WORK / CUTS"
        title="Vídeos"
        accentTitle="em fluxo."
        description="Uma fila operacional dos cortes — status, responsável e prazo sem transformar tudo em badge."
        metric={videos.length}
        metricLabel="CUTS / TOTAL"
        className="mb-8"
      />

      <VideosExplorer
        videos={light}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
