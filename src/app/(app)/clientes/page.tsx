import { listProjects, listClients } from "@/db/queries";
import { isOverdue, isDone } from "@/lib/domain";
import { ClientsExplorer } from "@/components/cutflow/clients-explorer";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clients, projects] = await Promise.all([listClients(), listProjects()]);

  const light = clients.map((c) => {
    const clientProjects = projects.filter((p) => p.clientId === c.id);
    const activeVideos = clientProjects.flatMap((p) => p.videos).filter((v: any) => !isDone(v.status));
    const overdueVideos = clientProjects.flatMap((p) => p.videos).filter((v: any) => isOverdue(v.finalDeadline, v.status));
    return {
      id: c.id,
      name: c.name,
      tradeName: c.tradeName,
      company: c.company,
      color: c.color,
      projectCount: clientProjects.length,
      activeVideoCount: activeVideos.length,
      overdueCount: overdueVideos.length,
    };
  });

  return (
    <div className="cf-fade-in space-y-5 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Clientes</h1>
        <p className="text-cf-text-dim text-sm">{clients.length} clientes</p>
      </div>
      <ClientsExplorer clients={light} />
    </div>
  );
}
