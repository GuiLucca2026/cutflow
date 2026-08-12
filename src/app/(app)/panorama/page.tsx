import { listVideos, listUsers } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { VideoCard } from "@/components/cutflow/video-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { isDone, isOverdue, isWaitingClient, computeClientWait, ROLE_META } from "@/lib/domain";
import { fmtHours } from "@/lib/format";
import { AlertTriangle, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Panorama — supervisão mútua (não é relatório de chefe pra equipe).
// Todo mundo vê a produtora inteira dividida POR PESSOA: quantos vídeos
// ativos, quantos atrasados, o que está parado esperando cliente. A ideia é
// que dê pra perceber sozinho quem está afogado e quem tem coisa travada,
// sem precisar perguntar — e sem mexer nas telas pessoais (Minha Edição e
// Planejar Semana continuam mostrando só a fila de quem está logado).
export default async function PanoramaPage() {
  const [videos, users, currentUser] = await Promise.all([listVideos(), listUsers(), getCurrentUser()]);
  const active = videos.filter((v) => !isDone(v.status));

  const stats = (list: typeof active) => ({
    total: list.length,
    overdue: list.filter((v) => isOverdue(v.finalDeadline, v.status)),
    waiting: list.filter((v) => isWaitingClient(v.status)),
    chase: list.filter((v) => computeClientWait(v)?.kind === "COBRAR_FEEDBACK"),
    hours: list.reduce((acc, v) => acc + Math.max(0, v.estimatedHours - v.actualHours), 0),
  });

  const company = stats(active);

  // Só quem tem vídeo ativo aparece — uma lista cheia de gente com zero em
  // tudo esconderia justamente quem precisa de atenção.
  const people = users
    .map((u) => ({ user: u, ...stats(active.filter((v) => v.editorId === u.id)) }))
    .filter((p) => p.total > 0)
    // Mais atrasados primeiro; empatou, quem tem mais coisa na mão.
    .sort((a, b) => b.overdue.length - a.overdue.length || b.total - a.total);

  // Vídeo ativo sem editor é o buraco clássico de responsabilidade: não
  // aparece na fila de ninguém, então ninguém se sente dono e ele atrasa em
  // silêncio. Aqui ele fica no topo, impossível de não ver.
  const unassigned = stats(active.filter((v) => !v.editorId));

  return (
    <div className="cf-fade-in space-y-6 pb-16">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Panorama</h1>
        <p className="text-cf-text-dim text-sm">
          Como está a produtora inteira, por pessoa — todo mundo vê tudo. Sua fila pessoal continua em Minha Edição.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Vídeos ativos" value={company.total} />
        <Stat label="Atrasados" value={company.overdue.length} tone={company.overdue.length > 0 ? "danger" : "default"} />
        <Stat label="Aguardando cliente" value={company.waiting.length} tone={company.chase.length > 0 ? "warn" : "default"} />
        <Stat label="Horas restantes" value={fmtHours(company.hours)} />
      </div>

      {unassigned.total > 0 && (
        <section className="rounded-xl border border-amber-500/40 bg-cf-surface p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
              <UserX className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold">Sem responsável</div>
              <div className="text-xs text-cf-text-dim">
                {unassigned.total} {unassigned.total === 1 ? "vídeo ativo não está" : "vídeos ativos não estão"} na fila de ninguém
                {unassigned.overdue.length > 0 && ` · ${unassigned.overdue.length} já ${unassigned.overdue.length === 1 ? "atrasado" : "atrasados"}`}
              </div>
            </div>
          </div>
          <CardGrid videos={unassigned.overdue.length > 0 ? unassigned.overdue : active.filter((v) => !v.editorId)} />
        </section>
      )}

      {people.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-8 text-center text-sm text-cf-text-dim">
          Nenhum vídeo ativo atribuído no momento.
        </div>
      ) : (
        <div className="space-y-4">
          {people.map((p) => {
            const isMe = p.user.id === currentUser.id;
            const role = ROLE_META[p.user.role];
            return (
              <section
                key={p.user.id}
                className={cn(
                  "rounded-xl border bg-cf-surface p-4",
                  p.overdue.length > 0 ? "border-red-500/30" : "border-cf-border"
                )}
              >
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <Avatar name={p.user.name} color={p.user.avatarColor} src={p.user.avatarUrl} size={36} />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {p.user.name}
                      {isMe && <span className="text-cf-text-dim font-normal"> · você</span>}
                    </div>
                    <div className="text-xs text-cf-text-dim">
                      {p.total} {p.total === 1 ? "vídeo ativo" : "vídeos ativos"} · ~{fmtHours(p.hours)} restantes
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    {role && <Badge color={role.color}>{role.label}</Badge>}
                    {p.overdue.length > 0 && (
                      <Badge color="#DC2626" solid>
                        {p.overdue.length} {p.overdue.length === 1 ? "atrasado" : "atrasados"}
                      </Badge>
                    )}
                    {p.chase.length > 0 && (
                      <Badge color="#B45309" solid>
                        {p.chase.length} a cobrar
                      </Badge>
                    )}
                    {p.overdue.length === 0 && p.chase.length === 0 && (
                      <span className="text-xs text-cf-success font-medium">Tudo no prazo</span>
                    )}
                  </div>
                </div>

                {p.overdue.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> Atrasados
                    </div>
                    <CardGrid videos={p.overdue} />
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "danger" | "warn" }) {
  return (
    <div className="rounded-xl border border-cf-border bg-cf-surface p-4">
      <div
        className={cn(
          "font-display text-3xl leading-none",
          tone === "danger" && "text-red-600",
          tone === "warn" && "text-amber-600"
        )}
      >
        {value}
      </div>
      <div className="text-xs text-cf-text-dim mt-1">{label}</div>
    </div>
  );
}

function CardGrid({ videos }: { videos: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
