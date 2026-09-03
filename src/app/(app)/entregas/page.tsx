import { listVideos } from "@/db/queries";
import { VideoCard } from "@/components/cutflow/video-card";
import { isDone, isOverdue } from "@/lib/domain";
import { isToday, isTomorrow, differenceInCalendarDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  const videos = await listVideos();

  const hoje = videos.filter((v) => !isDone(v.status) && isToday(new Date(v.finalDeadline)));
  const amanha = videos.filter((v) => !isDone(v.status) && isTomorrow(new Date(v.finalDeadline)));
  const estaSemana = videos.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), new Date());
    return !isDone(v.status) && d > 1 && d <= 7;
  });
  const proximaSemana = videos.filter((v) => {
    const d = differenceInCalendarDays(new Date(v.finalDeadline), new Date());
    return !isDone(v.status) && d > 7 && d <= 14;
  });
  const atrasadas = videos.filter((v) => isOverdue(v.finalDeadline, v.status, v.alterationStartedAt));
  const entregues = videos.filter((v) => v.status === "ENTREGUE").slice(0, 12);

  const groups = [
    { title: "Atrasadas", items: atrasadas, tone: "danger" as const },
    { title: "Hoje", items: hoje },
    { title: "Amanhã", items: amanha },
    { title: "Esta semana", items: estaSemana },
    { title: "Próxima semana", items: proximaSemana },
    { title: "Entregues recentemente", items: entregues, dim: true },
  ];

  return (
    <div className="cf-fade-in space-y-8 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Entregas</h1>
        <p className="text-cf-text-dim text-sm">Central de entregas — {videos.filter((v) => !isDone(v.status)).length} vídeos ativos</p>
      </div>

      {/* Grupo vazio some — antes cada um virava uma caixa tracejada "Nada
          aqui", e a página era mais caixa vazia do que vídeo. Se todos
          estiverem vazios, um aviso só. */}
      {groups.every((g) => g.items.length === 0) && (
        <div className="rounded-xl border border-dashed border-cf-border px-6 py-10 text-center text-sm text-cf-text-dim">
          Nenhuma entrega nas próximas duas semanas.
        </div>
      )}
      {groups.filter((g) => g.items.length > 0).map((g) => (
        <section key={g.title}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className={`font-display text-2xl tracking-wide ${g.tone === "danger" ? "text-red-600" : g.dim ? "text-cf-text-dim" : ""}`}>
              {g.title}
            </h2>
            <span className="text-cf-text-dim text-sm">{g.items.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {g.items.map((v) => (
              <VideoCard key={v.id} video={v as any} showRisk={!g.dim} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
