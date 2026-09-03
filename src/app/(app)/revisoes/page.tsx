import { listVideos } from "@/db/queries";
import { VideoCard } from "@/components/cutflow/video-card";
import { WaitingRow } from "@/components/cutflow/waiting-row";
import { PageHeader } from "@/components/cutflow/page-header";

export const dynamic = "force-dynamic";

export default async function RevisoesPage() {
  const videos = await listVideos();

  const revisaoInterna = videos.filter((v) => v.status === "REVISAO_INTERNA");
  const correcaoInterna = videos.filter((v) => v.status === "CORRECAO_INTERNA");
  const alteracaoSolicitada = videos.filter((v) => v.status === "ALTERACAO_SOLICITADA" || v.status === "EM_ALTERACAO");
  // Aguardando feedback e Aguardando aprovação eram status separados;
  // foram unidos (Fase 14, ver STATUS_META em lib/domain.ts) por serem
  // redundantes na prática — mesmo tratamento em todo o app.
  const aguardandoFeedback = videos.filter((v) => v.status === "AGUARDANDO_FEEDBACK" || v.status === "ENVIADO_AO_CLIENTE");

  const groups = [
    { title: "Revisão interna", items: revisaoInterna },
    { title: "Correção interna", items: correcaoInterna },
    { title: "Alterações solicitadas pelo cliente", items: alteracaoSolicitada },
    { title: "Aguardando retorno do cliente", items: aguardandoFeedback, showWaiting: true },
  ];

  return (
    <div className="cf-fade-in space-y-8 pb-16">
      <PageHeader eyebrow="WORK / REVIEWS" title="Revisões" subtitle="Revisões internas, feedback do cliente e alterações em andamento." />

      {groups.every((g) => g.items.length === 0) && (
        <div className="rounded-xl border border-dashed border-cf-border px-6 py-10 text-center text-sm text-cf-text-dim">
          Nada em revisão ou aguardando o cliente no momento.
        </div>
      )}
      {groups.filter((g) => g.items.length > 0).map((g) => (
        <section key={g.title}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="font-display text-2xl tracking-wide">{g.title}</h2>
            <span className="text-cf-text-dim text-sm">{g.items.length}</span>
          </div>
          {g.showWaiting ? (
            <div className="space-y-2">
              {g.items.map((v: any) => (
                <WaitingRow key={v.id} video={v} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {g.items.map((v: any) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
