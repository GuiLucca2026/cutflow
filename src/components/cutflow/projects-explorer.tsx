"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PRIORITY_META, isDone, isOverdue } from "@/lib/domain";
import { ProjectCard, type ProjectPosterData } from "@/components/cutflow/project-card";
import { EmptyState } from "@/components/cutflow/empty-state";
import { cn } from "@/lib/utils";

type Scope = "all" | "active" | "late" | "done";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "late", label: "Atrasados" },
  { value: "done", label: "Concluídos" },
];

function isProjectDone(project: ProjectPosterData) {
  return project.videos.length > 0 && project.videos.every((video) => isDone(video.status));
}

function isProjectLate(project: ProjectPosterData) {
  return project.videos.some(
    (video) => !isDone(video.status) && isOverdue(video.finalDeadline, video.status, video.alterationStartedAt)
  );
}

export function ProjectsExplorer({ projects }: { projects: ProjectPosterData[] }) {
  const [q, setQ] = React.useState("");
  const [clientId, setClientId] = React.useState("all");
  const [priority, setPriority] = React.useState("all");
  const [scope, setScope] = React.useState<Scope>("all");

  const clients = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const project of projects) {
      if (project.client) map.set(project.client.id, { id: project.client.id, name: project.client.name });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const counts = React.useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((project) => !isProjectDone(project)).length,
      late: projects.filter(isProjectLate).length,
      done: projects.filter(isProjectDone).length,
    }),
    [projects]
  );

  const filtered = projects.filter((project) => {
    if (q && !`${project.name} ${project.client?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (clientId !== "all" && project.client?.id !== clientId) return false;
    if (priority !== "all" && project.priority !== priority) return false;
    if (scope === "active" && isProjectDone(project)) return false;
    if (scope === "done" && !isProjectDone(project)) return false;
    if (scope === "late" && !isProjectLate(project)) return false;
    return true;
  });

  const hasFilters = q || clientId !== "all" || priority !== "all" || scope !== "all";

  function clearAll() {
    setQ("");
    setClientId("all");
    setPriority("all");
    setScope("all");
  }

  return (
    <div className="space-y-7">
      <div className="border-y border-cf-border">
        <div className="flex flex-col gap-4 py-3.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {SCOPES.map((item) => {
              const active = scope === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setScope(item.value)}
                  className={cn(
                    "relative shrink-0 border-b-2 py-1.5 text-[12px] font-medium transition-colors",
                    active ? "border-cf-primary text-cf-text" : "border-transparent text-cf-text-dim hover:text-cf-text"
                  )}
                >
                  {item.label}
                  <span className="ml-1.5 font-editorial text-[15px]">{counts[item.value]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[210px] flex-1 xl:w-[260px] xl:flex-none">
              <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cf-text-dim" />
              <Input
                placeholder="Buscar projeto ou cliente"
                className="h-9 rounded-none border-0 border-b border-cf-border bg-transparent pl-6 pr-2 shadow-none focus:border-cf-primary focus:ring-0"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </div>

            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-9 w-[170px] rounded-none border-0 border-b border-cf-border bg-transparent px-1 focus:ring-0">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9 w-[145px] rounded-none border-0 border-b border-cf-border bg-transparent px-1 focus:ring-0">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda prioridade</SelectItem>
                {Object.entries(PRIORITY_META).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-9 items-center gap-1.5 px-1 text-xs text-cf-text-dim transition-colors hover:text-cf-text"
              >
                <X className="h-3.5 w-3.5" /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nada em movimento aqui."
          description="Nenhum projeto corresponde aos filtros selecionados."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
