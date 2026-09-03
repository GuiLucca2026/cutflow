"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoCard } from "@/components/cutflow/video-card";
import { EditableNotes } from "@/components/cutflow/editable-notes";
import { TaskList } from "@/components/cutflow/task-list";
import { updateProjectNotes } from "@/app/actions";
import { fmtDateTime } from "@/lib/format";
import {
  Activity,
  ExternalLink,
  FileText,
  Film,
  FolderOpen,
  Link2,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINK_CATEGORY_LABEL: Record<string, string> = {
  FOOTAGE: "Footage",
  EDICAO: "Edição",
  ENTREGA: "Entrega",
  REFERENCIA: "Referências",
};

const TAB_VALUES = ["videos", "tarefas", "arquivos", "info", "atividade"] as const;
type ProjectTab = (typeof TAB_VALUES)[number];

function isProjectTab(value: string | null): value is ProjectTab {
  return !!value && TAB_VALUES.includes(value as ProjectTab);
}

export function ProjectTabs({ project, activity, users }: { project: any; activity: any[]; users: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");
  const openTasks = (project.tasks ?? []).filter((task: any) => !task.done).length;
  // Derivado direto da URL (fonte única de verdade) em vez de useState+effect
  // sincronizando os dois — evita cascading render (mesmo fix já aplicado
  // numa rodada anterior deste componente; o pacote reintroduziu o padrão
  // antigo ao adicionar a navegação por seta, então reaplico aqui).
  // changeTab só escreve na URL; o valor ativo recalcula sozinho no
  // próximo render via searchParams.
  const activeTab: ProjectTab = isProjectTab(queryTab) ? queryTab : "videos";

  function changeTab(value: string) {
    if (!isProjectTab(value)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "videos") params.delete("tab");
    else params.set("tab", value);
    if (value !== "videos") params.delete("video");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function navigateByArrow(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = TAB_VALUES.indexOf(activeTab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (current + direction + TAB_VALUES.length) % TAB_VALUES.length;
    changeTab(TAB_VALUES[next]);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-project-tab="${TAB_VALUES[next]}"]`)?.focus();
    });
  }

  const tabs = [
    { value: "videos" as const, label: "Vídeos", count: project.videos.length, icon: Film },
    { value: "tarefas" as const, label: "Tarefas", count: openTasks, icon: ListChecks },
    { value: "arquivos" as const, label: "Arquivos", count: project.links.length, icon: FolderOpen },
    { value: "info" as const, label: "Briefing", icon: FileText },
    { value: "atividade" as const, label: "Atividade", count: activity.length, icon: Activity },
  ];

  return (
    <Tabs value={activeTab} onValueChange={changeTab} className="space-y-0">
      <div className="sticky top-[54px] z-20 -mx-1 bg-cf-canvas/95 py-2 backdrop-blur-[8px]" onKeyDown={navigateByArrow}>
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="cf-micro text-cf-text-dim">WORKSPACE</div>
          <div className="hidden text-[11px] text-cf-text-dim sm:block">← → navegam · URL preserva a aba</div>
        </div>
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex h-auto w-max min-w-full justify-start gap-1 rounded-[12px] border border-cf-border bg-cf-surface p-1.5">
            {tabs.map(({ value, label, count, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                data-project-tab={value}
                className={cn(
                  "group relative min-h-[44px] min-w-[132px] flex-1 gap-2 rounded-[8px] border border-transparent px-3 py-2 text-[12px] font-medium text-cf-text-dim transition-[color,background-color,border-color] duration-[var(--cf-dur-hover)]",
                  "hover:bg-cf-surface-2/70 hover:text-cf-text",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-cf-primary after:transition-transform after:duration-[var(--cf-dur-hover)]",
                  "data-[state=active]:border-cf-border data-[state=active]:bg-cf-surface-2 data-[state=active]:text-cf-text data-[state=active]:shadow-none data-[state=active]:after:scale-x-100"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70 group-data-[state=active]:text-cf-primary group-data-[state=active]:opacity-100" />
                <span>{label}</span>
                {typeof count === "number" ? (
                  <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-[6px] bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-cf-text-dim group-data-[state=active]:bg-cf-primary/10 group-data-[state=active]:text-cf-primary">{count}</span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      <TabsContent value="videos" className="cf-tab-content mt-5">
        <TabHeader
          eyebrow="CUTS"
          title="Vídeos do projeto"
          description="Status, responsáveis e prazos em uma única leitura."
          metric={`${project.videos.length} ${project.videos.length === 1 ? "vídeo" : "vídeos"}`}
        />
        {project.videos.length === 0 ? (
          <div className="border-b border-cf-border py-14 text-center">
            <div className="text-2xl font-semibold tracking-[-0.03em]">Nada em corte ainda.</div>
            <div className="mt-2 text-sm text-cf-text-dim">Nenhum vídeo foi criado neste projeto.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {project.videos.map((video: any) => (
              <VideoCard
                key={video.id}
                video={{ ...video, project: { name: project.name, client: { name: project.client?.name, color: project.client?.color } } }}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="tarefas" className="cf-tab-content mt-5">
        <TabHeader
          eyebrow="TASKS"
          title="Tarefas do projeto"
          description="Ações abertas e responsáveis sem misturar com a fila de vídeos."
          metric={`${openTasks} abertas`}
        />
        <TaskList tasks={project.tasks ?? []} users={users} context={{ projectId: project.id }} />
      </TabsContent>

      <TabsContent value="arquivos" className="cf-tab-content mt-5">
        <TabHeader
          eyebrow="FILES / LINKS"
          title="Arquivos e referências"
          description="Acesso rápido ao material de produção, edição e entrega."
          metric={`${project.links.length} links`}
        />
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          {["FOOTAGE", "EDICAO", "ENTREGA", "REFERENCIA"].map((category) => {
            const links = project.links.filter((link: any) => link.category === category);
            if (links.length === 0) return null;
            return (
              <div key={category} className="border-t border-cf-border py-4">
                <div className="cf-micro mb-2 text-cf-text-dim">{LINK_CATEGORY_LABEL[category]}</div>
                <div className="space-y-1.5">
                  {links.map((link: any) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-9 items-center gap-2 border-b border-transparent text-sm text-cf-text transition-colors hover:border-cf-border hover:text-cf-primary"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-cf-text-dim" />
                      <span className="truncate">{link.label}</span>
                      <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-cf-text-dim" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="info" className="cf-tab-content mt-5">
        <TabHeader
          eyebrow="BRIEF"
          title="Briefing e observações"
          description="Contexto persistente do projeto para a equipe trabalhar com a mesma referência."
        />
        <div className="max-w-3xl border-t border-cf-border py-5">
          <EditableNotes value={project.notes ?? null} onSave={(notes) => updateProjectNotes(project.id, notes)} />
        </div>
      </TabsContent>

      <TabsContent value="atividade" className="cf-tab-content mt-5">
        <TabHeader
          eyebrow="HISTORY"
          title="Atividade"
          description="Registro cronológico das mudanças feitas no projeto."
          metric={`${activity.length} eventos`}
        />
        {activity.length === 0 ? (
          <div className="border-b border-cf-border py-14 text-center text-sm text-cf-text-dim">Sem atividade registrada.</div>
        ) : (
          <ol className="space-y-4 border-l border-cf-border pl-4">
            {activity.map((item: any) => (
              <li key={item.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-cf-primary" />
                <div className="text-cf-text">{item.action}{item.detail ? ` — ${item.detail}` : ""}</div>
                <div className="text-xs text-cf-text-dim">{fmtDateTime(item.createdAt)}</div>
              </li>
            ))}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  );
}

function TabHeader({
  eyebrow,
  title,
  description,
  metric,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metric?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 border-b border-cf-border pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="cf-micro text-cf-text-dim">{eyebrow}</div>
        <div className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-cf-text">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-cf-text-dim">{description}</p>
      </div>
      {metric ? <div className="shrink-0 text-xs font-medium tabular-nums text-cf-text-dim">{metric}</div> : null}
    </div>
  );
}
