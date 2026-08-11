import { notFound } from "next/navigation";
import { getClient, listProjectsByClient } from "@/db/queries";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/cutflow/badges";
import { projectProgress } from "@/lib/domain";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const projects = await listProjectsByClient(id);

  return (
    <div className="cf-fade-in space-y-5 pb-16">
      <div className="rounded-xl border border-cf-border bg-cf-surface p-5 flex flex-wrap items-center gap-5">
        <Avatar name={client.name} color={client.color} size={56} />
        <div className="flex-1 min-w-[200px]">
          <h1 className="font-display text-3xl tracking-wide">{client.name}</h1>
          <div className="text-sm text-cf-text-dim">{client.company ?? client.tradeName}</div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-cf-text-dim">
          {client.contactName && <span>{client.contactName}</span>}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-cf-lime">
              <Mail className="h-3.5 w-3.5" /> {client.email}
            </a>
          )}
          {client.whatsapp && (
            <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-cf-lime">
              <MessageCircle className="h-3.5 w-3.5" /> {client.whatsapp}
            </a>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl tracking-wide mb-3">Projetos ({projects.length})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {projects.map((p) => {
            const progress = projectProgress(p.videos);
            return (
              <Link key={p.id} href={`/projetos/${p.id}`} className="rounded-xl border border-cf-border bg-cf-surface p-4 hover:border-cf-lime/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-cf-text-dim">{p.type} · {p.videos.length} vídeos</div>
                  </div>
                  <PriorityBadge priority={p.priority} />
                </div>
                <div className="mt-3">
                  <Progress value={progress} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
