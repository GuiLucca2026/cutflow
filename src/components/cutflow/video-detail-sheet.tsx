"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusBadge, PriorityBadge, RiskBadge, ClientWaitBadge } from "@/components/cutflow/badges";
import { RenameDialog } from "@/components/cutflow/rename-dialog";
import { Hint } from "@/components/ui/tooltip";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import {
  KANBAN_STATUSES,
  STATUS_META,
  TEAM_ROLE_META,
  TEAM_ROLES,
  computeClientWait,
  computeDeliveryRisk,
  statusProgress,
  isDone,
  isOverdue,
  isWaitingClient,
} from "@/lib/domain";
import { fmtDateFull, fmtDateTime, fmtRelative, fmtWaitingSince, fmtHours } from "@/lib/format";
import {
  updateVideoStatus,
  toggleChecklistItem,
  addComment,
  addRevision,
  addVideoVersion,
  resolveRevision,
  addTeamMember,
  removeTeamMember,
  setVideoResponsible,
  setVideoProject,
  renameVideo,
  updateVideoField,
} from "@/app/actions";
import { FolderKanban, ExternalLink, Clock, AlertTriangle, Plus, X, Pencil } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

type User = { id: string; name: string; avatarColor: string };
type ProjectLite = { id: string; name: string; clientName: string | null };

export function VideoDetailSheetHost({ users, projects = [] }: { users: User[]; projects?: ProjectLite[] }) {
  const { openVideoId, close, bump, refresh } = useVideoDetail();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!openVideoId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(withBasePath(`/api/videos/${openVideoId}`))
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [openVideoId, bump]);

  // Duas velocidades de "atualizar depois de uma ação", de propósito.
  // `refresh()` só re-busca os dados DESTE vídeo (uma chamada leve à
  // /api/videos/[id]) — suficiente pra checklist, comentário, versão nova
  // ou resolver uma alteração, já que nada disso aparece fora da própria
  // aba. `router.refresh()` já é bem mais caro: refaz TODO o layout (usuário
  // atual, todos os usuários, clientes, projetos, todos os vídeos, carga de
  // trabalho, alertas) mais a página de fundo inteira. Antes disso rodava
  // em toda ação — inclusive marcar um item do checklist — e cada clique
  // esperava por ~7 idas ao banco que não tinham nada a ver com o que foi
  // clicado. Só troca de status precisa da versão cara, porque só ela muda
  // a coluna no Kanban / os cartões da lista / os números da Hoje.
  function refreshLight() {
    refresh();
  }
  function refreshAfterStatusChange() {
    refresh();
    router.refresh();
  }

  return (
    <Sheet open={!!openVideoId} onOpenChange={(v) => !v && close()}>
      <SheetContent className="p-0">
        {loading && !data ? (
          <div className="p-6 space-y-3">
            <div className="h-6 w-2/3 bg-cf-surface-2 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-cf-surface-2 rounded animate-pulse" />
            <div className="h-32 w-full bg-cf-surface-2 rounded animate-pulse" />
          </div>
        ) : data?.video ? (
          <VideoDetailBody
            video={data.video}
            activity={data.activity}
            users={users}
            projects={projects}
            onMutate={refreshLight}
            onStatusChange={refreshAfterStatusChange}
          />
        ) : (
          <div className="p-6 text-cf-text-dim text-sm">Vídeo não encontrado.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function VideoDetailBody({
  video,
  activity,
  users,
  projects,
  onMutate,
  onStatusChange,
}: {
  video: any;
  activity: any[];
  users: User[];
  projects: ProjectLite[];
  onMutate: () => void;
  onStatusChange: () => void;
}) {
  const [commentBody, setCommentBody] = React.useState("");
  const [revisionDesc, setRevisionDesc] = React.useState("");
  const [renaming, setRenaming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  // Checklist otimista: marcar/desmarcar responde na hora, sem esperar a
  // ida ao servidor + o refetch depois — a demora de rede (que ainda
  // existe, Supabase é um serviço remoto) fica invisível pro usuário. Se a
  // ação falhar, desfaz. Reseta pro estado real sempre que `video` mudar
  // de referência (chega dado novo do servidor), o que também corrige
  // sozinho qualquer divergência (ex: completedBy/completedAt reais).
  const [checklist, setChecklist] = React.useState(video.checklist);
  React.useEffect(() => setChecklist(video.checklist), [video.checklist]);

  const risk = computeDeliveryRisk(video);
  const clientWait = computeClientWait(video);
  const progress = statusProgress(video.status);
  const overdue = isOverdue(video.finalDeadline, video.status);
  const checklistDone = checklist.filter((c: any) => c.done).length;

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2 text-xs text-cf-text-dim">
          <FolderKanban className="h-3.5 w-3.5" />
          {video.project ? (
            <>
              <Link href={`/projetos/${video.projectId}`} className="hover:text-cf-lime transition-colors">
                {video.project.name}
              </Link>
              <span>·</span>
              <span>{video.project.client?.name ?? "—"}</span>
            </>
          ) : (
            <span>Vídeo avulso · sem projeto</span>
          )}
        </div>
        <div className="group flex items-center gap-2">
          <SheetTitle>{video.name}</SheetTitle>
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="shrink-0 text-cf-text-dim opacity-0 transition-opacity hover:text-cf-lime group-hover:opacity-100"
            title="Renomear vídeo"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <RenameDialog
          open={renaming}
          onClose={() => setRenaming(false)}
          currentName={video.name}
          onRename={async (next) => {
            await renameVideo(video.id, next);
            onMutate();
          }}
        />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge status={video.status} />
          <PriorityBadge priority={video.priority} />
          {/* Mesma regra dos cards: risco e espera nunca aparecem juntos —
              ver o comentário maior em video-card.tsx. */}
          {!isDone(video.status) && !isWaitingClient(video.status) && !clientWait && <RiskBadge risk={risk} />}
          {clientWait && <ClientWaitBadge wait={clientWait} />}
          {overdue && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" /> Atrasado
            </span>
          )}
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto cf-scrollbar-thin p-5 space-y-5">
        {/* Status changer */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim shrink-0">Status</span>
          <Select
            value={video.status}
            onValueChange={(v) =>
              startTransition(async () => {
                await updateVideoStatus(video.id, v);
                toast.success(`Status alterado para ${STATUS_META[v]?.label ?? v}`);
                onStatusChange();
              })
            }
          >
            <SelectTrigger className="w-auto min-w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-cf-text-dim mb-1">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Projeto — diferente de responsável/cliente, "sem projeto" É uma
            opção válida (vídeo avulso). Editável aqui e no menu de botão
            direito do card ("Mover para projeto") — ver setVideoProject em
            actions.ts. */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-cf-text-dim">Projeto</div>
          <Select
            value={video.projectId ?? "__none__"}
            onValueChange={(v) =>
              startTransition(async () => {
                await setVideoProject(video.id, v === "__none__" ? null : v);
                toast.success(v === "__none__" ? "Vídeo desvinculado do projeto." : "Vídeo vinculado ao projeto.");
                onStatusChange();
              })
            }
          >
            <SelectTrigger><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem projeto (avulso)</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}{p.clientName ? ` — ${p.clientName}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Responsável é editável aqui (e no menu de botão direito do card).
            Não existe opção "sem responsável": todo vídeo tem que ter dono
            — ver setVideoResponsible em actions.ts. */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-cf-text-dim">Responsável</div>
          <Select
            value={video.editorId ?? ""}
            onValueChange={(v) =>
              startTransition(async () => {
                await setVideoResponsible(video.id, v);
                toast.success(`Responsável atualizado.`);
                onStatusChange();
              })
            }
          >
            <SelectTrigger><SelectValue placeholder="Definir responsável" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aprovador é opcional (ao contrário de Responsável) — nem todo
            vídeo já tem um aprovador definido, então "Sem aprovador" é uma
            opção válida na lista, não só o estado inicial. */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-cf-text-dim">Aprovador</div>
          <Select
            value={video.approverId ?? "__none__"}
            onValueChange={(v) =>
              startTransition(async () => {
                await updateVideoField(video.id, "approverId", v === "__none__" ? null : v);
                toast.success(v === "__none__" ? "Aprovador removido." : "Aprovador definido.");
                onMutate();
              })
            }
          >
            <SelectTrigger><SelectValue placeholder="Definir aprovador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem aprovador</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Key facts grid — Formato fica só leitura (definido na criação);
            Versão atual e Rodadas de alteração também ficam só leitura de
            propósito: são contadores que já se atualizam sozinhos a partir
            das abas Versões/Alterações logo abaixo, então editar aqui
            direto criaria dois lugares divergentes pra a mesma informação
            (ver Hint em cada um explicando isso). Horas estimadas/
            realizadas e Complexidade viram campos editáveis. */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Fact label="Formato" value={`${video.format} · ${video.aspectRatio}`} />
          <Hint text="Atualiza sozinha quando você envia uma nova versão na aba Versões, mais abaixo.">
            <div><Fact label="Versão atual" value={video.currentVersion ?? "—"} /></div>
          </Hint>
          {/* onStatusChange (não onMutate): estas duas horas entram direto
              na fórmula de risco (computeDeliveryRisk em lib/domain.ts),
              que os cards fora desta aba (Kanban, Hoje, listas) também
              calculam — precisa do refresh pesado pra eles acompanharem. */}
          <EditableHoursFact label="Horas estimadas" field="estimatedHours" value={video.estimatedHours} videoId={video.id} onMutate={onStatusChange} />
          <EditableHoursFact label="Horas realizadas" field="actualHours" value={video.actualHours} videoId={video.id} onMutate={onStatusChange} />
          <Hint text="Conta sozinha: sobe 1 a cada alteração registrada na aba Alterações, mais abaixo.">
            <div><Fact label="Rodadas de alteração" value={String(video.revisionCount)} /></div>
          </Hint>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-cf-text-dim mb-0.5">Complexidade</div>
            <Select
              value={video.complexity}
              onValueChange={(v) =>
                startTransition(async () => {
                  await updateVideoField(video.id, "complexity", v);
                  toast.success("Complexidade atualizada.");
                  onMutate();
                })
              }
            >
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SIMPLES">Simples</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="COMPLEXA">Complexa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <VideoTeamSection videoId={video.id} team={video.team ?? []} users={users} onMutate={onMutate} />

        {/* The date model — never collapse to one due date */}
        <div className="rounded-lg border border-cf-border bg-cf-surface-2 p-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim mb-1">Datas</div>
          <DateRow label="Início planejado" value={video.plannedStartDate} />
          <DateRow label="Prazo interno" value={video.internalDeadline} />
          <DateRow label="Prazo de revisão" value={video.reviewDeadline} />
          <DateRow label="Prazo do cliente" value={video.clientDeadline} />
          <DateRow label="Prazo final" value={video.finalDeadline} highlight />
          {video.originalFinalDeadline !== video.finalDeadline && (
            <div className="text-xs text-amber-600/90 pt-1 border-t border-cf-border mt-1">
              Prazo original: {fmtDateFull(video.originalFinalDeadline)}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          {video.frameioUrl && <LinkChip href={video.frameioUrl} label="Frame.io" />}
          {video.driveUrl && <LinkChip href={video.driveUrl} label="Google Drive" />}
          {video.fileUrl && <LinkChip href={video.fileUrl} label="Arquivo" />}
        </div>

        <Tabs defaultValue="checklist">
          <TabsList>
            <TabsTrigger value="checklist">Checklist ({checklistDone}/{checklist.length})</TabsTrigger>
            <TabsTrigger value="revisoes">Alterações ({video.revisions.length})</TabsTrigger>
            <TabsTrigger value="versoes">Versões ({video.versions.length})</TabsTrigger>
            <TabsTrigger value="comentarios">Comentários ({video.comments.length})</TabsTrigger>
            <TabsTrigger value="atividade">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-1">
            {checklist.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-cf-surface-2">
                <label className="flex flex-1 min-w-0 items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={(v) => {
                      const next = !!v;
                      setChecklist((prev: any[]) => prev.map((c) => (c.id === item.id ? { ...c, done: next } : c)));
                      startTransition(async () => {
                        try {
                          await toggleChecklistItem(item.id, next, {
                            videoId: video.id,
                            videoName: video.name,
                            projectId: video.projectId ?? null,
                            label: item.label,
                          });
                          onMutate();
                        } catch {
                          setChecklist((prev: any[]) => prev.map((c) => (c.id === item.id ? { ...c, done: !next } : c)));
                          toast.error("Não foi possível atualizar o checklist.");
                        }
                      });
                    }}
                  />
                  <span className={item.done ? "text-cf-text-dim line-through truncate" : "text-cf-text truncate"}>{item.label}</span>
                </label>
                {/* Quem marcou esse item — some junto quando reaberto, já
                    que a atribuição só vale enquanto estiver feito. */}
                {item.done && item.completedBy && (
                  <div
                    className="flex shrink-0 items-center gap-1.5 pl-2"
                    title={`Concluído por ${item.completedBy.name}${item.completedAt ? " · " + fmtRelative(item.completedAt) : ""}`}
                  >
                    <Avatar name={item.completedBy.name} color={item.completedBy.avatarColor} size={18} />
                    <span className="hidden sm:inline text-[11px] text-cf-text-dim">{item.completedBy.name.split(" ")[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="revisoes" className="space-y-3">
            {video.revisions.length === 0 && <EmptyHint text="Nenhuma alteração registrada ainda." />}
            {video.revisions.map((r: any) => (
              <div key={r.id} className="rounded-lg border border-cf-border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cf-lime">ALTERAÇÃO #{r.number}</span>
                  <StatusBadge status={r.status === "CONCLUIDA" ? "ENTREGUE" : r.status === "EM_ANDAMENTO" ? "EM_ALTERACAO" : "ALTERACAO_SOLICITADA"} />
                </div>
                <p className="text-sm text-cf-text">&ldquo;{r.description}&rdquo;</p>
                <div className="flex items-center justify-between text-xs text-cf-text-dim">
                  <span>Responsável: {r.assignedTo?.name ?? "—"} {r.type === "CLIENTE" ? "· pedido pelo cliente" : "· interno"}</span>
                  {r.dueAt && <span>Prazo: {fmtDateTime(r.dueAt)}</span>}
                </div>
                {r.status !== "CONCLUIDA" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-1"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await resolveRevision(r.id);
                        toast.success("Alteração marcada como concluída.");
                        onMutate();
                      })
                    }
                  >
                    Marcar como concluída
                  </Button>
                )}
              </div>
            ))}
            <NewRevisionForm videoId={video.id} users={users} defaultEditorId={video.editorId} onDone={onMutate} />
          </TabsContent>

          <TabsContent value="versoes" className="space-y-3">
            {video.versions.length === 0 && <EmptyHint text="Nenhuma versão enviada ainda." />}
            {video.versions.map((v: any) => (
              <div key={v.id} className="flex items-start gap-3 rounded-lg border border-cf-border p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cf-lime/10 text-cf-lime font-display text-sm">
                  {v.label}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{v.notes || "Sem observações."}</div>
                  <div className="text-xs text-cf-text-dim mt-0.5">{fmtDateTime(v.sentAt)}</div>
                </div>
              </div>
            ))}
            <NewVersionForm videoId={video.id} nextLabel={`V${video.versions.length + 1}`} onDone={onMutate} />
          </TabsContent>

          <TabsContent value="comentarios" className="space-y-3">
            {video.comments.length === 0 && <EmptyHint text="Nenhum comentário ainda." />}
            {video.comments.map((c: any) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar name={c.author?.name ?? c.authorName ?? "?"} color={c.author?.avatarColor} size={26} />
                <div className="flex-1 min-w-0 rounded-lg bg-cf-surface-2 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{c.author?.name ?? c.authorName}</span>
                    <span className="text-[11px] text-cf-text-dim">{fmtRelative(c.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-0.5">{c.body}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Textarea placeholder="Escreva um comentário…" value={commentBody} onChange={(e) => setCommentBody(e.target.value)} className="min-h-[44px]" />
              <Button
                disabled={pending || !commentBody.trim()}
                onClick={() =>
                  startTransition(async () => {
                    await addComment(video.id, commentBody);
                    setCommentBody("");
                    onMutate();
                  })
                }
              >
                Enviar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="atividade" className="space-y-3">
            {activity.length === 0 && <EmptyHint text="Sem atividade registrada." />}
            <ol className="space-y-3 border-l border-cf-border pl-4">
              {activity.map((a: any) => (
                <li key={a.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-cf-lime" />
                  <div className="text-cf-text">{a.action}{a.detail ? ` — ${a.detail}` : ""}</div>
                  <div className="text-xs text-cf-text-dim">{a.user?.name ?? "Sistema"} · {fmtDateTime(a.createdAt)}</div>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Equipe do vídeo (Fase 8) — colaboradores extras além do Editor
// responsável (o Fact "Editor" logo acima), cada um com uma função
// (Montagem, Motion, Colorização, Trilha...). Puramente informativo: não
// mexe em Minha Edição/carga de trabalho/Analytics, que continuam olhando
// só video.editorId.
function VideoTeamSection({
  videoId,
  team,
  users,
  onMutate,
}: {
  videoId: string;
  team: any[];
  users: User[];
  onMutate: () => void;
}) {
  const [userId, setUserId] = React.useState("");
  const [role, setRole] = React.useState(TEAM_ROLES[0]);
  const [pending, startTransition] = React.useTransition();

  function add() {
    if (!userId || pending) return;
    startTransition(async () => {
      await addTeamMember(videoId, userId, role);
      setUserId("");
      toast.success("Adicionado à equipe.");
      onMutate();
    });
  }

  function remove(memberId: string) {
    startTransition(async () => {
      await removeTeamMember(memberId, videoId);
      toast.success("Removido da equipe.");
      onMutate();
    });
  }

  return (
    <div className="rounded-lg border border-cf-border bg-cf-surface-2 p-3 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim">
        Equipe {team.length > 0 && <span className="text-cf-text-dim/70 normal-case">({team.length})</span>}
      </div>
      {team.length === 0 ? (
        <p className="text-xs text-cf-text-dim">Só o Editor responsável, por enquanto.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {team.map((t) => (
            <div key={t.id} className="flex items-center gap-1.5 rounded-full border border-cf-border bg-cf-surface pl-1 pr-1.5 py-1">
              <Avatar name={t.user?.name ?? "?"} color={t.user?.avatarColor} size={20} />
              <span className="text-xs font-medium">{t.user?.name?.split(" ")[0] ?? "?"}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEAM_ROLE_META[t.role]?.color }}>
                {TEAM_ROLE_META[t.role]?.label ?? t.role}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(t.id)}
                className="text-cf-text-dim hover:text-red-600 transition-colors disabled:opacity-50"
                title="Remover da equipe"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Adicionar pessoa…" /></SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[150px] shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TEAM_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{TEAM_ROLE_META[r].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" disabled={!userId || pending} onClick={add}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Horas estimadas/realizadas eram só leitura na ficha — não existia NENHUM
// jeito de registrar hora trabalhada de verdade num vídeo, só o valor que
// veio da criação. Salva no blur (ou Enter), não a cada tecla — evita
// mandar uma escrita pro banco por dígito digitado. Confirma o valor
// vindo do servidor sempre que `value` mudar de referência, igual o
// checklist logo abaixo faz.
function EditableHoursFact({
  label,
  field,
  value,
  videoId,
  onMutate,
}: {
  label: string;
  field: "estimatedHours" | "actualHours";
  value: number;
  videoId: string;
  onMutate: () => void;
}) {
  const [text, setText] = React.useState(String(value));
  React.useEffect(() => setText(String(value)), [value]);
  const [pending, startTransition] = React.useTransition();

  function commit() {
    const parsed = Number(text.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setText(String(value));
      return;
    }
    if (parsed === value) return;
    startTransition(async () => {
      await updateVideoField(videoId, field, parsed);
      toast.success(`${label} atualizado para ${fmtHours(parsed)}.`);
      onMutate();
    });
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-cf-text-dim mb-0.5">{label}</div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          step={0.5}
          disabled={pending}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-8 w-20 px-2 text-sm font-medium"
        />
        <span className="text-cf-text-dim text-xs">h</span>
      </div>
    </div>
  );
}

function Fact({ label, value, avatar }: { label: string; value: string; avatar?: { name: string; avatarColor: string } | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-cf-text-dim mb-0.5">{label}</div>
      <div className="flex items-center gap-1.5 font-medium">
        {avatar && <Avatar name={avatar.name} color={avatar.avatarColor} size={18} />}
        {value}
      </div>
    </div>
  );
}

function DateRow({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-cf-text-dim">{label}</span>
      <span className={highlight ? "font-semibold text-cf-text" : "text-cf-text"}>{value ? fmtDateFull(value) : "—"}</span>
    </div>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-cf-border bg-cf-surface-2 px-2.5 py-1 text-xs text-cf-text-dim hover:text-cf-lime hover:border-cf-lime/40 transition-colors"
    >
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="text-sm text-cf-text-dim text-center py-6 border border-dashed border-cf-border rounded-lg">{text}</div>;
}

function NewRevisionForm({ videoId, users, defaultEditorId, onDone }: { videoId: string; users: User[]; defaultEditorId?: string; onDone: () => void }) {
  const [desc, setDesc] = React.useState("");
  const [type, setType] = React.useState<"CLIENTE" | "INTERNA">("CLIENTE");
  const [assignedTo, setAssignedTo] = React.useState(defaultEditorId ?? "");
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="rounded-lg border border-dashed border-cf-border p-3 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim">Registrar alteração</div>
      <Textarea placeholder='Ex: "Trocar a música e remover a cena aos 00:34."' value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Select value={type} onValueChange={(v: any) => setType(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENTE">Pedido do cliente</SelectItem>
            <SelectItem value="INTERNA">Correção interna</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        size="sm"
        disabled={pending || !desc.trim()}
        onClick={() =>
          startTransition(async () => {
            await addRevision({ videoId, description: desc, type, assignedToId: assignedTo || undefined });
            setDesc("");
            toast.success("Alteração registrada.");
            onDone();
          })
        }
      >
        <Plus className="h-3.5 w-3.5" /> Registrar
      </Button>
    </div>
  );
}

function NewVersionForm({ videoId, nextLabel, onDone }: { videoId: string; nextLabel: string; onDone: () => void }) {
  const [label, setLabel] = React.useState(nextLabel);
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="rounded-lg border border-dashed border-cf-border p-3 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim">Enviar nova versão</div>
      <div className="flex gap-2">
        <Input className="w-24" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button
        size="sm"
        disabled={pending || !label.trim()}
        onClick={() =>
          startTransition(async () => {
            await addVideoVersion(videoId, label, notes);
            setNotes("");
            toast.success(`${label} enviada.`);
            onDone();
          })
        }
      >
        <Plus className="h-3.5 w-3.5" /> Enviar versão
      </Button>
    </div>
  );
}
