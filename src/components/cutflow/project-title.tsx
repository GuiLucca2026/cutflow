"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { RenameDialog } from "@/components/cutflow/rename-dialog";
import { renameProject } from "@/app/actions";

// Título do projeto com lápis de renomear ao lado — mesma ação que já
// existia no menu de botão direito do card (ProjectContextMenu), só que
// direto na página de detalhe, onde é mais fácil de achar. Reaproveita o
// mesmo RenameDialog e a mesma action, não duplica lógica nenhuma.
export function ProjectTitle({ id, name, className }: { id: string; name: string; className?: string }) {
  const [renaming, setRenaming] = React.useState(false);

  return (
    <>
      <div className="group flex items-center gap-2">
        <h1 className={className}>{name}</h1>
        <button
          type="button"
          onClick={() => setRenaming(true)}
          className="shrink-0 text-cf-text-dim opacity-0 transition-opacity hover:text-cf-lime group-hover:opacity-100"
          title="Renomear projeto"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <RenameDialog open={renaming} onClose={() => setRenaming(false)} currentName={name} onRename={(next) => renameProject(id, next)} />
    </>
  );
}
