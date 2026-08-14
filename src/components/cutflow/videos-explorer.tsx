"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { VideoCard, type VideoCardData } from "@/components/cutflow/video-card";
import { STATUS_META, PRIORITY_META, isOverdue, isWaitingClient } from "@/lib/domain";
import { Search, X } from "lucide-react";

type Video = VideoCardData & { editorId: string | null; clientId?: string };

export function VideosExplorer({
  videos,
  users,
  clients,
}: {
  videos: Video[];
  users: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [editor, setEditor] = React.useState<string>("all");
  const [client, setClient] = React.useState<string>("all");
  const [priority, setPriority] = React.useState<string>("all");
  const [onlyOverdue, setOnlyOverdue] = React.useState(false);
  const [onlyWaiting, setOnlyWaiting] = React.useState(false);

  const filtered = videos.filter((v) => {
    if (q && !`${v.name} ${v.project?.name} ${v.project?.client?.name}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "all" && v.status !== status) return false;
    if (editor !== "all" && v.editorId !== editor) return false;
    if (client !== "all" && v.clientId !== client) return false;
    if (priority !== "all" && v.priority !== priority) return false;
    if (onlyOverdue && !isOverdue(v.finalDeadline, v.status, v.alterationStartedAt)) return false;
    if (onlyWaiting && !isWaitingClient(v.status)) return false;
    return true;
  });

  const hasFilters = q || status !== "all" || editor !== "all" || client !== "all" || priority !== "all" || onlyOverdue || onlyWaiting;

  function clearAll() {
    setQ("");
    setStatus("all");
    setEditor("all");
    setClient("all");
    setPriority("all");
    setOnlyOverdue(false);
    setOnlyWaiting(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cf-text-dim" />
          <Input placeholder="Buscar vídeo, projeto…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={editor} onValueChange={setEditor}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Editor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os editores</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
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
        <Button variant={onlyOverdue ? "default" : "outline"} size="sm" onClick={() => setOnlyOverdue((v) => !v)}>
          Atrasados
        </Button>
        <Button variant={onlyWaiting ? "default" : "outline"} size="sm" onClick={() => setOnlyWaiting((v) => !v)}>
          Aguardando cliente
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
            <X className="h-3.5 w-3.5" /> Limpar
          </Button>
        )}
      </div>

      <div className="text-xs text-cf-text-dim">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cf-border p-10 text-center text-sm text-cf-text-dim">
          Nenhum vídeo corresponde aos filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
