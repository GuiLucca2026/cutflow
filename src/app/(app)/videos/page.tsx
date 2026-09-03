import { listVideos, listUsers, listClients } from "@/db/queries";
import { VideosExplorer } from "@/components/cutflow/videos-explorer";

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
      <header className="mb-9 pt-2 md:mb-12">
        <div className="cf-micro text-cf-text-dim">WORK / CUTS</div>
        <div className="mt-4 grid items-end gap-8 border-b border-cf-border pb-7 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="leading-[0.88] tracking-[-0.055em]">
              <span className="block text-[54px] font-semibold md:text-[72px]">Vídeos</span>
              <span className="font-editorial block text-[58px] font-normal md:text-[78px]">em fluxo.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-cf-text-dim">
              Uma fila operacional dos cortes — status, responsável e prazo sem transformar tudo em badge.
            </p>
          </div>
          <div className="hidden min-w-[120px] text-right sm:block">
            <div className="font-editorial text-[70px] leading-[0.72] tracking-[-0.045em] md:text-[86px]">{videos.length}</div>
            <div className="cf-micro mt-3 text-cf-text-dim">CUTS / TOTAL</div>
          </div>
        </div>
      </header>

      <VideosExplorer
        videos={light}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
