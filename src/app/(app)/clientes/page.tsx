import { listProjects, listClients } from "@/db/queries";
import { isOverdue, isDone } from "@/lib/domain";
import { ClientsExplorer } from "@/components/cutflow/clients-explorer";
import { PageHeader } from "@/components/cutflow/page-header";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clients, projects] = await Promise.all([listClients(), listProjects()]);

  const light = clients.map((c) => {
    const clientProjects = projects.filter((p) => p.clientId === c.id);
    const activeVideos = clientProjects.flatMap((p) => p.videos).filter((v: any) => !isDone(v.status));
    const overdueVideos = clientProjects.flatMap((p) => p.videos).filter((v: any) => isOverdue(v.finalDeadline, v.status, v.alterationStartedAt));
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
      <PageHeader eyebrow="MANAGE / CLIENTS" title="Clientes" subtitle={`${clients.length} clientes`} />
      <ClientsExplorer clients={light} />
    </div>
  );
}
