import Link from "next/link";
import { listProjects, listClients } from "@/db/queries";
import { isOverdue, isDone } from "@/lib/domain";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clients, projects] = await Promise.all([listClients(), listProjects()]);

  return (
    <div className="cf-fade-in space-y-5 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Clientes</h1>
        <p className="text-cf-text-dim text-sm">{clients.length} clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clients.map((c) => {
          const clientProjects = projects.filter((p) => p.clientId === c.id);
          const activeVideos = clientProjects.flatMap((p) => p.videos).filter((v) => !isDone(v.status));
          const overdueVideos = clientProjects.flatMap((p) => p.videos).filter((v) => isOverdue(v.finalDeadline, v.status));

          return (
            <Link key={c.id} href={`/clientes/${c.id}`} className="rounded-xl border border-cf-border bg-cf-surface p-4 hover:border-cf-lime/40 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} color={c.color} size={40} />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-cf-text-dim truncate">{c.tradeName ?? c.company ?? "—"}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <Stat label="Projetos" value={clientProjects.length} />
                <Stat label="Vídeos ativos" value={activeVideos.length} />
                <Stat label="Atrasados" value={overdueVideos.length} tone={overdueVideos.length > 0 ? "danger" : undefined} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className="rounded-lg bg-cf-surface-2 py-2">
      <div className={`font-display text-xl ${tone === "danger" && value > 0 ? "text-red-600" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-cf-text-dim">{label}</div>
    </div>
  );
}
