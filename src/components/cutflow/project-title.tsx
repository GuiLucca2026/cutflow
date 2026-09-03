"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { RenameDialog } from "@/components/cutflow/rename-dialog";
import { renameProject } from "@/app/actions";
import { cn } from "@/lib/utils";

export function ProjectTitle({
  id,
  name,
  className,
  editButtonClassName,
}: {
  id: string;
  name: string;
  className?: string;
  editButtonClassName?: string;
}) {
  const [renaming, setRenaming] = React.useState(false);

  return (
    <>
      <div className="group flex items-start gap-2">
        <h1 className={className}>{name}</h1>
        <button
          type="button"
          onClick={() => setRenaming(true)}
          className={cn(
            "mt-1 shrink-0 text-cf-text-dim opacity-0 transition-opacity hover:text-cf-primary group-hover:opacity-100 focus-visible:opacity-100",
            editButtonClassName
          )}
          title="Renomear projeto"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <RenameDialog open={renaming} onClose={() => setRenaming(false)} currentName={name} onRename={(next) => renameProject(id, next)} />
    </>
  );
}
