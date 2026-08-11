"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient, createProject, createProjectQuick, createVideo, createCapture } from "@/app/actions";
import { PROJECT_TYPES, VIDEO_FORMATS } from "@/db/schema";
import { PRIORITY_META } from "@/lib/domain";
import { cn } from "@/lib/utils";

export type CreateTab = "video" | "captacao" | "projeto" | "cliente";

type ClientLite = { id: string; name: string };
type ProjectLite = { id: string; name: string; clientId: string };
type UserLite = { id: string; name: string };

// One dialog, three tabs, instead of three separate dialogs behind a
// dropdown menu — and every "pick an existing X" select also offers
// "+ Criar novo X" inline, so you never have to close this panel, go
// create the client/project you're missing, then start over.
export function CreatePanel({
  open,
  tab,
  onTabChange,
  onClose,
  clients: initialClients,
  users,
  projects: initialProjects,
}: {
  open: boolean;
  tab: CreateTab;
  onTabChange: (tab: CreateTab) => void;
  onClose: () => void;
  clients: ClientLite[];
  users: UserLite[];
  projects: ProjectLite[];
}) {
  const router = useRouter();

  // Locally-tracked lists so a client/project created inline (nested two
  // levels deep, e.g. while creating a video) shows up immediately in every
  // picker in this session, without needing a full page refresh mid-flow.
  const [clients, setClients] = React.useState(initialClients);
  const [projects, setProjects] = React.useState(initialProjects);
  React.useEffect(() => setClients(initialClients), [initialClients]);
  React.useEffect(() => setProjects(initialProjects), [initialProjects]);

  const addClient = React.useCallback((c: ClientLite) => setClients((prev) => [...prev, c]), []);
  const addProject = React.useCallback((p: ProjectLite) => setProjects((prev) => [...prev, p]), []);

  function finish() {
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar</DialogTitle>
          <DialogDescription>
            Cadastre um cliente, um projeto, uma captação ou um vídeo — um vídeo pode ficar sem projeto por enquanto e
            ser vinculado depois.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => onTabChange(v as CreateTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="video">Vídeo</TabsTrigger>
            <TabsTrigger value="captacao">Captação</TabsTrigger>
            <TabsTrigger value="projeto">Projeto</TabsTrigger>
            <TabsTrigger value="cliente">Cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente">
            <ClientForm onCreated={(c) => { addClient(c); toast.success("Cliente criado."); finish(); }} />
          </TabsContent>

          <TabsContent value="projeto">
            <ProjectForm clients={clients} onAddClient={addClient} />
          </TabsContent>

          <TabsContent value="video">
            <VideoForm
              projects={projects}
              clients={clients}
              users={users}
              onAddClient={addClient}
              onAddProject={addProject}
              onCreated={() => { toast.success("Vídeo criado."); finish(); }}
            />
          </TabsContent>

          <TabsContent value="captacao">
            <CaptureForm
              projects={projects}
              clients={clients}
              users={users}
              onAddClient={addClient}
              onAddProject={addProject}
              onCreated={() => { toast.success("Captação agendada."); finish(); }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
function ClientForm({ onCreated }: { onCreated: (c: ClientLite) => void }) {
  const [name, setName] = React.useState("");
  const [tradeName, setTradeName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;
    setPending(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    if (tradeName) fd.set("tradeName", tradeName);
    if (contactName) fd.set("contactName", contactName);
    if (email) fd.set("email", email);
    if (whatsapp) fd.set("whatsapp", whatsapp);
    const id = await createClient(fd);
    setPending(false);
    if (id) onCreated({ id, name: name.trim() });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Nome / Razão social</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex: Vortex Sportwear" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-tradeName">Nome fantasia</Label>
          <Input id="c-tradeName" value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Vortex" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-contactName">Contato principal</Label>
          <Input id="c-contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Renata Souza" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-email">E-mail</Label>
          <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@cliente.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-whatsapp">WhatsApp</Label>
          <Input id="c-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 11 90000-0000" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending || !name.trim()}>{pending ? "Criando…" : "Criar cliente"}</Button>
      </DialogFooter>
    </form>
  );
}

// Inline picker: pick an existing client, or expand a one-field form to
// create one on the spot without leaving whatever you were filling out.
function ClientPicker({
  clients,
  value,
  onChange,
  onCreated,
}: {
  clients: ClientLite[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (c: ClientLite) => void;
}) {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleCreate() {
    if (!name.trim() || pending) return;
    setPending(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    const id = await createClient(fd);
    setPending(false);
    if (id) {
      onCreated({ id, name: name.trim() });
      onChange(id);
      setCreating(false);
      setName("");
    }
  }

  if (creating) {
    return (
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder="Nome do novo cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button type="button" size="sm" onClick={handleCreate} disabled={pending || !name.trim()}>
          {pending ? "…" : "Adicionar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setCreating(false); setName(""); }}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={(v) => (v === "__new__" ? setCreating(true) : onChange(v))}>
      <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
        <SelectItem value="__new__" className="text-cf-lime font-medium">+ Criar novo cliente</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ---------------------------------------------------------------------------
// Projeto
// ---------------------------------------------------------------------------
function ProjectForm({
  clients,
  onAddClient,
}: {
  clients: ClientLite[];
  onAddClient: (c: ClientLite) => void;
}) {
  const [name, setName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [type, setType] = React.useState("Outros");
  const [priority, setPriority] = React.useState("NORMAL");
  const [description, setDescription] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientId || pending) return;
    setPending(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("clientId", clientId);
    fd.set("type", type);
    fd.set("priority", priority);
    if (description) fd.set("description", description);
    // createProject redirects to the new project's page on success — that
    // navigation is what closes this dialog, so there's no onClose() call
    // (and no setPending(false)) on the success path here.
    await createProject(fd);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Nome do projeto</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex: Campanha Verão 2026" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} onCreated={onAddClient} />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Prioridade</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-description">Descrição</Label>
        <Textarea id="p-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefing rápido do projeto…" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending || !name.trim() || !clientId}>
          {pending ? "Criando…" : "Criar projeto"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Compact inline form (name, client — the 2 fields createProject actually
// requires; prazo de projeto não existe mais) used by ProjectPicker's
// "+ Criar novo projeto".
function InlineProjectCreate({
  clients,
  onAddClient,
  onCreated,
  onCancel,
}: {
  clients: ClientLite[];
  onAddClient: (c: ClientLite) => void;
  onCreated: (p: ProjectLite) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleCreate() {
    if (!name.trim() || !clientId || pending) return;
    setPending(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("clientId", clientId);
    const id = await createProjectQuick(fd);
    setPending(false);
    if (id) onCreated({ id, name: name.trim(), clientId });
  }

  return (
    <div className="rounded-lg border border-cf-border bg-cf-surface-2 p-3 space-y-2.5">
      <div className="text-xs font-semibold text-cf-text-dim">Novo projeto</div>
      <Input autoFocus placeholder="Nome do projeto" value={name} onChange={(e) => setName(e.target.value)} />
      <ClientPicker clients={clients} value={clientId} onChange={setClientId} onCreated={onAddClient} />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleCreate} disabled={pending || !name.trim() || !clientId}>
          {pending ? "Criando…" : "Adicionar projeto"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function ProjectPicker({
  projects,
  clients,
  value,
  onChange,
  onAddProject,
  onAddClient,
}: {
  projects: ProjectLite[];
  clients: ClientLite[];
  value: string;
  onChange: (id: string) => void;
  onAddProject: (p: ProjectLite) => void;
  onAddClient: (c: ClientLite) => void;
}) {
  const [creating, setCreating] = React.useState(false);

  if (creating) {
    return (
      <InlineProjectCreate
        clients={clients}
        onAddClient={onAddClient}
        onCreated={(p) => { onAddProject(p); onChange(p.id); setCreating(false); }}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <Select value={value} onValueChange={(v) => (v === "__new__" ? setCreating(true) : onChange(v))}>
      <SelectTrigger><SelectValue placeholder="Selecionar projeto (opcional)" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Sem projeto (vídeo avulso)</SelectItem>
        {projects.map((p) => {
          const client = clients.find((c) => c.id === p.clientId);
          return (
            <SelectItem key={p.id} value={p.id}>
              {p.name}{client ? ` — ${client.name}` : ""}
            </SelectItem>
          );
        })}
        <SelectItem value="__new__" className="text-cf-lime font-medium">+ Criar novo projeto</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ---------------------------------------------------------------------------
// Vídeo
// ---------------------------------------------------------------------------
function VideoForm({
  projects,
  clients,
  users,
  onAddClient,
  onAddProject,
  onCreated,
}: {
  projects: ProjectLite[];
  clients: ClientLite[];
  users: UserLite[];
  onAddClient: (c: ClientLite) => void;
  onAddProject: (p: ProjectLite) => void;
  onCreated: () => void;
}) {
  const [projectId, setProjectId] = React.useState("__none__");
  const [name, setName] = React.useState("");
  const [format, setFormat] = React.useState("Reel");
  const [editorId, setEditorId] = React.useState("");
  const [finalDeadline, setFinalDeadline] = React.useState("");
  const [estimatedHours, setEstimatedHours] = React.useState("4");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !finalDeadline || pending) return;
    setPending(true);
    const fd = new FormData();
    if (projectId && projectId !== "__none__") fd.set("projectId", projectId);
    fd.set("name", name.trim());
    fd.set("format", format);
    if (editorId) fd.set("editorId", editorId);
    fd.set("finalDeadline", finalDeadline);
    fd.set("estimatedHours", estimatedHours);
    const id = await createVideo(fd);
    setPending(false);
    if (id) onCreated();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Projeto</Label>
        <ProjectPicker projects={projects} clients={clients} value={projectId} onChange={setProjectId} onAddProject={onAddProject} onAddClient={onAddClient} />
        <p className="text-[11px] text-cf-text-dim">Pode deixar &quot;Sem projeto&quot; e vincular depois.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="v-name">Nome do vídeo</Label>
        <Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Reel 01" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Formato</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {VIDEO_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Editor</Label>
          <Select value={editorId} onValueChange={setEditorId}>
            <SelectTrigger><SelectValue placeholder="Atribuir editor" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="v-finalDeadline">Prazo final</Label>
          <Input id="v-finalDeadline" type="date" value={finalDeadline} onChange={(e) => setFinalDeadline(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-estimatedHours">Horas estimadas</Label>
          <Input id="v-estimatedHours" type="number" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending || !name.trim() || !finalDeadline}>{pending ? "Criando…" : "Criar vídeo"}</Button>
      </DialogFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Captação
// ---------------------------------------------------------------------------
// Toggle-chip multi-select — simpler than a combobox for a team that's
// realistically a handful of people, and makes who's already picked
// obvious at a glance instead of hidden inside a closed dropdown.
function CrewPicker({ users, value, onChange }: { users: UserLite[]; value: string[]; onChange: (ids: string[]) => void }) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {users.map((u) => {
        const active = value.includes(u.id);
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => toggle(u.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              active ? "border-cf-lime bg-cf-lime/10 text-cf-lime font-medium" : "border-cf-border text-cf-text-dim hover:text-cf-text"
            )}
          >
            {u.name}
          </button>
        );
      })}
    </div>
  );
}

function CaptureForm({
  projects,
  clients,
  users,
  onAddClient,
  onAddProject,
  onCreated,
}: {
  projects: ProjectLite[];
  clients: ClientLite[];
  users: UserLite[];
  onAddClient: (c: ClientLite) => void;
  onAddProject: (p: ProjectLite) => void;
  onCreated: () => void;
}) {
  const [projectId, setProjectId] = React.useState("__none__");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [crewIds, setCrewIds] = React.useState<string[]>([]);
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || pending) return;
    setPending(true);
    const fd = new FormData();
    if (projectId && projectId !== "__none__") fd.set("projectId", projectId);
    fd.set("title", title.trim());
    if (description) fd.set("description", description);
    fd.set("date", date);
    if (startTime) fd.set("startTime", startTime);
    if (endTime) fd.set("endTime", endTime);
    if (location) fd.set("location", location);
    crewIds.forEach((id) => fd.append("crewIds", id));
    const id = await createCapture(fd);
    setPending(false);
    if (id) onCreated();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Projeto</Label>
        <ProjectPicker projects={projects} clients={clients} value={projectId} onChange={setProjectId} onAddProject={onAddProject} onAddClient={onAddClient} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cap-title">Título</Label>
        <Input id="cap-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="Ex: Captação — Evento de lançamento" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cap-date">Data</Label>
          <Input id="cap-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cap-start">Início</Label>
          <Input id="cap-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cap-end">Fim</Label>
          <Input id="cap-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cap-location">Informações / local</Label>
        <Input id="cap-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço, ponto de encontro, acesso…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cap-description">Descrição</Label>
        <Textarea id="cap-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Roteiro do dia, equipamento necessário, observações…" />
      </div>
      <div className="space-y-1.5">
        <Label>Equipe</Label>
        <CrewPicker users={users} value={crewIds} onChange={setCrewIds} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending || !title.trim() || !date}>{pending ? "Agendando…" : "Agendar captação"}</Button>
      </DialogFooter>
    </form>
  );
}
