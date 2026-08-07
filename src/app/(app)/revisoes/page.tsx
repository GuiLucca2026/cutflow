import { listVideos } from "@/db/queries";
import { VideoCard } from "@/components/cutflow/video-card";
import { fmtWaitingSince } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RevisoesPage() {
  const videos = await listVideos();

  const revisaoInterna = videos.filter((v) => v.status === "REVISAO_INTERNA");
  const correcaoInterna = videos.filter((v) => v.status === "CORRECAO_INTERNA");
  const alteracaoSolicitada = videos.filter((v) => v.status === "ALTERACAO_SOLICITADA" || v.status === "EM_ALTERACAO");
  const aguardandoFeedback = videos.filter((v) => v.status === "AGUARDANDO_FEEDBACK" || v.status === "ENVIADO_AO_CLIENTE");
  const aguardandoAprovacao = videos.filter((v) => v.status === "AGUARDANDO_APROVACAO");

  const groups = [
    { title: "Revisão interna", items: revisaoInterna },
    { title: "Correção interna", items: correcaoInterna },
    { title: "Alterações solicitadas pelo cliente", items: alteracaoSolicitada },
    { title: "Aguardando feedback do cliente", items: aguardandoFeedback, showWaiting: true },
    { title: "Aguardando aprovação", items: aguardandoAprovacao },
  ];

  return (
    <div className="cf-fade-in space-y-8 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Revisões</h1>
        <p className="text-cf-text-dim text-sm">Central de revisões internas, do cliente e alterações em andamento</p>
      </div>

      {groups.map((g) => (
        <section key={g.title}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="font-display text-2xl tracking-wide">{g.title}</h2>
            <span className="text-cf-text-dim text-sm">{g.items.length}</span>
          </div>
          {g.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cf-border p-6 text-center text-sm text-cf-text-dim">Nada aqui.</div>
          ) : g.showWaiting ? (
            <div className="space-y-2">
              {g.items.map((v: any) => (
                <div key={v.id} className="flex items-center gap-3 rounded-lg border border-cf-border bg-cf-surface px-3.5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{v.project?.client?.name} — {v.name}</div>
                    <div className="text-xs text-cf-text-dim truncate">{v.project?.name}</div>
                  </div>
                  <div className="text-xs text-amber-400 font-semibold whitespace-nowrap">Aguardando há {fmtWaitingSince(v.updatedAt)}</div>
                </div>
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
