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
} from "@/components/ui/context-menu";
import { RenameDialog } from "@/components/cutflow/rename-dialog";
import { renameProject, deleteProject, restoreProject } from "@/app/actions";
import { FolderOpen, Pencil, Trash2 } from "lucide-react";

// Mesma ideia do VideoContextMenu (ver esse arquivo), só que pro card de
// Projeto — sem os atalhos de status/prioridade de vídeo, que não fazem
// sentido aqui. Excluir um projeto leva os vídeos dele junto pra Lixeira
// (ver deleteProject em actions.ts).
export function ProjectContextMenu({
  project,
  href,
  children,
}: {
  project: { id: string; name: string };
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = React.useState(false);

  function del() {
    deleteProject(project.id).then(() => router.refresh());
    toast(`"${project.name}" (e os vídeos dele) movido para a lixeira.`, {
      action: {
        label: "Desfazer",
        onClick: () => restoreProject(project.id).then(() => router.refresh()),
      },
    });
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => router.push(href)} className="gap-2">
            <FolderOpen className="h-3.5 w-3.5" /> Abrir
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setRenaming(true)} className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Renomear
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={del} destructive className="gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <RenameDialog
        open={renaming}
        onClose={() => setRenaming(false)}
        currentName={project.name}
        onRename={(name) => renameProject(project.id, name)}
      />
    </>
  );
}
