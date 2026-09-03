"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoCard } from "@/components/cutflow/video-card";
import { EditableNotes } from "@/components/cutflow/editable-notes";
import { TaskList } from "@/components/cutflow/task-list";
import { updateProjectNotes } from "@/app/actions";
import { fmtDateTime } from "@/lib/format";
import { ExternalLink, Link2 } from "lucide-react";

const LINK_CATEGORY_LABEL: Record<string, string> = {
  FOOTAGE: "Footage",
  EDICAO: "Edição",
  ENTREGA: "Entrega",
  REFERENCIA: "Referências",
};

export function ProjectTabs({ project, activity, users }: { project: any; activity: any[]; users: { id: string; name: string }[] }) {
  const openTasks = (project.tasks ?? []).filter((t: any) => !t.done).length;
  return (
    <Tabs defaultValue="videos">
      <TabsList className="w-full justify-start gap-6 rounded-none border-0 border-b border-cf-border bg-transparent p-0">
        <TabsTrigger value="videos" className="rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-xs font-medium data-[state=active]:border-cf-primary data-[state=active]:bg-transparent data-[state=active]:text-cf-text data-[state=active]:shadow-none">Vídeos ({project.videos.length})</TabsTrigger>
        <TabsTrigger value="tarefas" className="rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-xs font-medium data-[state=active]:border-cf-primary data-[state=active]:bg-transparent data-[state=active]:text-cf-text data-[state=active]:shadow-none">Tarefas ({openTasks})</TabsTrigger>
        <TabsTrigger value="arquivos" className="rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-xs font-medium data-[state=active]:border-cf-primary data-[state=active]:bg-transparent data-[state=active]:text-cf-text data-[state=active]:shadow-none">Arquivos ({project.links.length})</TabsTrigger>
        <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-xs font-medium data-[state=active]:border-cf-primary data-[state=active]:bg-transparent data-[state=active]:text-cf-text data-[state=active]:shadow-none">Briefing</TabsTrigger>
        <TabsTrigger value="atividade" className="rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-xs font-medium data-[state=active]:border-cf-primary data-[state=active]:bg-transparent data-[state=active]:text-cf-text data-[state=active]:shadow-none">Atividade</TabsTrigger>
      </TabsList>

      <TabsContent value="videos">
        {project.videos.length === 0 ? (
          <div className="border-b border-cf-border py-14 text-center">
            <div className="text-2xl font-semibold tracking-[-0.03em]">Nada em corte ainda.</div>
            <div className="mt-2 text-sm text-cf-text-dim">Nenhum vídeo foi criado neste projeto.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {project.videos.map((v: any) => (
              <VideoCard
                key={v.id}
                video={{ ...v, project: { name: project.name, client: { name: project.client?.name, color: project.client?.color } } }}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="tarefas">
        <TaskList tasks={project.tasks ?? []} users={users} context={{ projectId: project.id }} />
      </TabsContent>

      <TabsContent value="arquivos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {["FOOTAGE", "EDICAO", "ENTREGA", "REFERENCIA"].map((cat) => {
            const links = project.links.filter((l: any) => l.category === cat);
            if (links.length === 0) return null;
            return (
              <div key={cat} className="border-t border-cf-border py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim mb-2">{LINK_CATEGORY_LABEL[cat]}</div>
                <div className="space-y-1.5">
                  {links.map((l: any) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-cf-text hover:text-cf-lime transition-colors"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-cf-text-dim" />
                      <span className="truncate">{l.label}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-cf-text-dim ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="info">
        <div className="max-w-2xl border-t border-cf-border py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-cf-text-dim mb-2">Briefing / Observações</div>
          <EditableNotes value={project.notes ?? null} onSave={(notes) => updateProjectNotes(project.id, notes)} />
        </div>
      </TabsContent>

      <TabsContent value="atividade">
        {activity.length === 0 ? (
          <div className="border-b border-cf-border py-14 text-center text-sm text-cf-text-dim">Sem atividade registrada.</div>
        ) : (
          <ol className="space-y-4 border-l border-cf-border pl-4">
            {activity.map((a: any) => (
              <li key={a.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-cf-lime" />
                <div className="text-cf-text">{a.action}{a.detail ? ` — ${a.detail}` : ""}</div>
                <div className="text-xs text-cf-text-dim">{fmtDateTime(a.createdAt)}</div>
              </li>
            ))}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  );
}
