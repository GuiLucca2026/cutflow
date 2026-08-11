"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { RenameDialog } from "@/components/cutflow/rename-dialog";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";
import { Avatar } from "@/components/ui/avatar";
import {
  updateVideoStatus,
  renameVideo,
  deleteVideo,
  restoreVideo,
  updateVideoField,
  setVideoResponsible,
  setVideoProject,
} from "@/app/actions";
import { KANBAN_STATUSES, STATUS_META, PRIORITY_META } from "@/lib/domain";
import { PRIORITIES } from "@/db/schema";
import { FolderOpen, Pencil, Flag, ListChecks, Trash2, UserRound, FolderKanban } from "lucide-react";

// Menu de botão direito no card de vídeo — mesma ideia do menu do Google
// Drive que o usuário mandou de referência (Renomear, Excluir, atalhos
// pros campos mais trocados), só que com as ações que fazem sentido pra
// um vídeo em produção em vez de um arquivo. Reaproveitado tanto pelo
// VideoCard quanto pelo KanbanCard — ver os dois arquivos.
export function VideoContextMenu({
  video,
  onOpen,
  children,
}: {
  video: { id: string; name: string; status: string; priority: string; editorId?: string | null; projectId?: string | null };
  onOpen: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = React.useState(false);
  // A equipe e a lista de projetos vêm do contexto (carregadas uma vez no
  // layout) — assim o card não precisa receber essas listas de página em
  // página.
  const { users, projects } = useVideoDetail();

  function del() {
    // Otimista + desfazer no próprio toast — igual Drive/Gmail: exclui na
    // hora, mas dá uma saída rápida sem precisar abrir a Lixeira de novo
    // por um clique errado.
    deleteVideo(video.id).then(() => router.refresh());
    toast(`"${video.name}" movido para a lixeira.`, {
      action: {
        label: "Desfazer",
        onClick: () => restoreVideo(video.id).then(() => router.refresh()),
      },
    });
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onOpen} className="gap-2">
            <FolderOpen className="h-3.5 w-3.5" /> Abrir
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setRenaming(true)} className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Renomear
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Sem opção de "tirar o responsável": todo vídeo tem que ter um
              dono (ver setVideoResponsible em actions.ts). Só dá pra passar
              o bastão pra outra pessoa. */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <UserRound className="h-3.5 w-3.5" /> Definir responsável
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {users.length === 0 && <ContextMenuItem disabled>Ninguém cadastrado</ContextMenuItem>}
              {users.map((u) => (
                <ContextMenuItem
                  key={u.id}
                  onSelect={() =>
                    setVideoResponsible(video.id, u.id).then(() => {
                      toast.success(`${video.name} agora é responsabilidade de ${u.name.split(" ")[0]}.`);
                      router.refresh();
                    })
                  }
                  className="gap-2"
                >
                  <Avatar name={u.name} color={u.avatarColor} size={16} />
                  <span className={u.id === video.editorId ? "font-semibold" : undefined}>{u.name}</span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Vídeo pode ficar avulso (sem projeto) de propósito — diferente
              do responsável, aqui "Sem projeto" é uma opção legítima na
              lista, não só o estado inicial. Ver setVideoProject em
              actions.ts. */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <FolderKanban className="h-3.5 w-3.5" /> Mover para projeto
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-72 overflow-y-auto">
              <ContextMenuItem
                onSelect={() =>
                  setVideoProject(video.id, null).then(() => {
                    toast.success(`${video.name} desvinculado do projeto.`);
                    router.refresh();
                  })
                }
                className="gap-2"
              >
                <span className={!video.projectId ? "font-semibold" : undefined}>Sem projeto (avulso)</span>
              </ContextMenuItem>
              {projects.length > 0 && <ContextMenuSeparator />}
              {projects.map((p) => (
                <ContextMenuItem
                  key={p.id}
                  onSelect={() =>
                    setVideoProject(video.id, p.id).then(() => {
                      toast.success(`${video.name} movido para "${p.name}".`);
                      router.refresh();
                    })
                  }
                  className="gap-2"
                >
                  <span className={p.id === video.projectId ? "font-semibold" : undefined}>
                    {p.name}{p.clientName ? ` — ${p.clientName}` : ""}
                  </span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <ListChecks className="h-3.5 w-3.5" /> Definir status
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {KANBAN_STATUSES.map((status) => (
                <ContextMenuItem
                  key={status}
                  onSelect={() => updateVideoStatus(video.id, status).then(() => router.refresh())}
                  className="gap-2"
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_META[status]?.color }} />
                  <span className={status === video.status ? "font-semibold" : undefined}>{STATUS_META[status]?.label}</span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <Flag className="h-3.5 w-3.5" /> Definir prioridade
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {PRIORITIES.map((priority) => (
                <ContextMenuItem
                  key={priority}
                  onSelect={() => updateVideoField(video.id, "priority", priority).then(() => router.refresh())}
                  className="gap-2"
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_META[priority]?.color }} />
                  <span className={priority === video.priority ? "font-semibold" : undefined}>{PRIORITY_META[priority]?.label}</span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          <ContextMenuItem onSelect={del} destructive className="gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <RenameDialog
        open={renaming}
        onClose={() => setRenaming(false)}
        currentName={video.name}
        onRename={(name) => renameVideo(video.id, name)}
      />
    </>
  );
}
