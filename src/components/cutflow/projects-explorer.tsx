"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/cutflow/badges";
import { ProjectContextMenu } from "@/components/cutflow/project-context-menu";
import { AvatarStack } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PRIORITY_META, isOverdue, isDone, projectProgress } from "@/lib/domain";
import { Search, X, AlertTriangle } from "lucide-react";

type ProjectLite = {
  id: string;
  name: string;
  type: string;
  priority: string;
  client: { id: string; name: string; color: string } | null;
  videos: { status: string; finalDeadline: string; editorId: string | null; editor: { name: string; avatarColor: string } | null }[];
};

// Mesmo padrão de filtro do VideosExplorer (busca + selects), aplicado aqui
// porque a lista de Projetos não tinha NENHUM jeito de filtrar — com 8
// projetos de demonstração isso não incomoda, com 200 vira o único jeito
// de achar algo. Cada card também ganhou um sinal de atraso (contagem de
// vídeos atrasados do projeto), que antes só existia no card de Cliente —
// inconsistência: o nível mais específico (Projeto) mostrava MENOS sinal
// de risco que o nível mais genérico (Cliente) acima dele.
export function ProjectsExplorer({ projects }: { projects: ProjectLite[] }) {
  const [q, setQ] = React.useState("");
  const [clientId, setClientId] = React.useState("all");
  const [priority, setPriority] = React.useState("all");

  const clients = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const p of projects) if (p.client) map.set(p.client.id, { id: p.client.id, name: p.client.name });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const filtered = projects.filter((p) => {
    if (q && !`${p.name} ${p.client?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (clientId !== "all" && p.client?.id !== clientId) return false;
    if (priority !== "all" && p.priority !== priority) return false;
    return true;
  });

  const hasFilters = q || clientId !== "all" || priority !== "all";
  function clearAll() {
    setQ("");
    setClientId("all");
    setPriority("all");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cf-text-dim" />
          <Input placeholder="Buscar projeto, cliente…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda prioridade</SelectItem>
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
            <X className="h-3.5 w-3.5" /> Limpar
          </Button>
        )}
      </div>

      <div className="text-xs text-cf-text-dim">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-10 text-center text-sm text-cf-text-dim">
          Nenhum projeto corresponde aos filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((p) => {
            const progress = projectProgress(p.videos);
            const active = p.videos.filter((v) => !isDone(v.status));
            const overdue = active.filter((v) => isOverdue(v.finalDeadline, v.status));
            const editors = Array.from(
              new Map(p.videos.filter((v) => v.editorId && v.editor).map((v) => [v.editorId as string, v.editor!])).values()
            );

            return (
              <ProjectContextMenu key={p.id} project={{ id: p.id, name: p.name }} href={`/projetos/${p.id}`}>
                <Link
                  href={`/projetos/${p.id}`}
                  className="rounded-xl border border-cf-border bg-cf-surface p-4 hover:border-cf-lime/40 transition-colors block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.client?.color }} />
                        <span className="text-xs text-cf-text-dim truncate">{p.client?.name}</span>
                      </div>
                      <h3 className="font-semibold mt-0.5 truncate">{p.name}</h3>
                      <div className="text-xs text-cf-text-dim mt-0.5">{p.type} · {p.videos.length} vídeos</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {overdue.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                          <AlertTriangle className="h-3 w-3" /> {overdue.length} atrasado{overdue.length === 1 ? "" : "s"}
                        </span>
                      )}
                      <PriorityBadge priority={p.priority} />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-cf-text-dim mb-1">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  {editors.length > 0 && (
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-cf-border">
                      <AvatarStack people={editors.map((e) => ({ name: e.name, color: e.avatarColor }))} />
                    </div>
                  )}
                </Link>
              </ProjectContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
