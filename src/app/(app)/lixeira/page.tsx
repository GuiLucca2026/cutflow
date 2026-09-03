import { listDeletedVideos, listDeletedProjects } from "@/db/queries";
import { TrashList } from "@/components/cutflow/trash-list";
import { PageHeader } from "@/components/cutflow/page-header";

export const dynamic = "force-dynamic";

// Lixeira (Fase 7) — pra onde vai tudo que passa por "Excluir" no menu de
// botão direito do card (ver video-context-menu.tsx / project-context-menu.tsx).
// Nada aqui é apagado de verdade até alguém clicar em "Excluir
// definitivamente" — ver deleteVideo/deleteProject em actions.ts, que só
// marcam deleted_at.
export default async function LixeiraPage() {
  const [videos, projects] = await Promise.all([listDeletedVideos(), listDeletedProjects()]);

  return (
    <div className="cf-fade-in space-y-8 pb-16">
      <PageHeader
        eyebrow="MANAGE / ARCHIVE"
        title="Lixeira"
        subtitle={projects.length + videos.length === 0 ? "Vazia." : `${projects.length} ${projects.length === 1 ? "projeto" : "projetos"} · ${videos.length} ${videos.length === 1 ? "vídeo" : "vídeos"}`}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-cf-text-dim uppercase tracking-wide">Projetos</h2>
        <TrashList
          kind="project"
          emptyText="Nenhum projeto na lixeira."
          items={projects.map((p) => ({
            id: p.id,
            name: p.name,
            subtitle: p.client?.name ?? "—",
            deletedAt: p.deletedAt,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-cf-text-dim uppercase tracking-wide">Vídeos</h2>
        <TrashList
          kind="video"
          emptyText="Nenhum vídeo na lixeira."
          items={videos.map((v) => ({
            id: v.id,
            name: v.name,
            subtitle: v.project ? `${v.project.client?.name ?? "—"} · ${v.project.name}` : "Vídeo avulso",
            deletedAt: v.deletedAt,
          }))}
        />
      </section>
    </div>
  );
}
