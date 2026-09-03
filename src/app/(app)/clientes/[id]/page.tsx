import { notFound } from "next/navigation";
import { getClient, listProjectsByClient } from "@/db/queries";
import { Avatar } from "@/components/ui/avatar";
import { EditableNotes } from "@/components/cutflow/editable-notes";
import { updateClientNotes } from "@/app/actions";
import { projectProgress } from "@/lib/domain";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const projects = await listProjectsByClient(id);

  return (
    <div className="cf-fade-in space-y-8 pb-16">
      <header className="border-b border-cf-border pb-7 pt-[18px]">
        <div className="cf-micro text-cf-text-dim">CLIENT / PROFILE</div>
        <div className="mt-4 flex flex-wrap items-end gap-5">
          <Avatar name={client.name} color={client.color} size={52} />
          <div className="min-w-[220px] flex-1">
            <h1 className="text-[44px] font-semibold leading-[0.94] tracking-[-0.048em] md:text-[56px]">{client.name}<span className="font-editorial font-normal">.</span></h1>
            <div className="mt-3 text-sm text-cf-text-dim">{client.company ?? client.tradeName ?? "—"}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-cf-text-dim">
            {client.contactName && <span>{client.contactName}</span>}
            {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-cf-primary"><Mail className="h-3.5 w-3.5" /> {client.email}</a>}
            {client.whatsapp && <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-cf-primary"><MessageCircle className="h-3.5 w-3.5" /> {client.whatsapp}</a>}
          </div>
        </div>
      </header>

      <section className="max-w-2xl border-t border-cf-border py-5">
        <div className="cf-micro mb-3 text-cf-text-dim">NOTES / CLIENT</div>
        <EditableNotes value={client.notes ?? null} onSave={(notes) => updateClientNotes(client.id, notes)} />
      </section>

      <section>
        <div className="mb-4 flex items-baseline gap-2 border-b border-cf-border pb-2">
          <h2 className="text-[26px] font-semibold tracking-[-0.03em]">Projetos</h2>
          <span className="text-sm font-semibold tabular-nums text-cf-text-dim">{projects.length}</span>
        </div>
        <div className="divide-y divide-cf-border border-b border-cf-border">
          {projects.map((p, index) => {
            const progress = projectProgress(p.videos);
            return (
              <Link key={p.id} href={`/projetos/${p.id}`} className="group grid gap-4 py-4 transition-colors hover:text-cf-primary md:grid-cols-[72px_1fr_110px] md:items-center">
                <div className="cf-micro text-cf-text-dim">PROJECT / {String(index + 1).padStart(2, "0")}</div>
                <div className="min-w-0">
                  <div className="truncate text-[17px] font-semibold tracking-[-0.02em]">{p.name}</div>
                  <div className="mt-1 text-xs text-cf-text-dim">{p.type} · {p.videos.length} vídeos</div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="cf-micro text-cf-text-dim">PROGRESS</span>
                    <span className="text-xl font-semibold tabular-nums leading-none">{progress}%</span>
                  </div>
                  <div className="mt-2 h-[2px] bg-cf-border"><div className="h-full bg-cf-primary" style={{ width: `${progress}%` }} /></div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
