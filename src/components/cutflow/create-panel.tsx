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
import { DatePicker } from "@/components/ui/date-picker";
import { createClient, createProject, createProjectQuick, createVideo, createVideosBulk, createCapture } from "@/app/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Layers } from "lucide-react";
import { PROJECT_TYPES, VIDEO_FORMATS } from "@/db/schema";
import { PRIORITY_META } from "@/lib/domain";
import { cn } from "@/lib/utils";

export type CreateTab = "video" | "captacao" | "projeto" | "cliente";

type ClientLite = { id: string; name: string };
type ProjectLite = { id: string; name: string; clientId: string };
type UserLite = { id: string; name: string };

// Um seletor que também aceita cadastrar na hora ("+ Criar novo cliente")
// não cria nada sozinho: ele guarda o rascunho e só grava quando o
// formulário de fora é salvo. Quem está de fora chama commit() antes de
// gravar o próprio registro e recebe o id final — assim quem preencheu o
// nome de um projeto novo e clicou direto em "Criar vídeo" não perde o que
// digitou nem precisa clicar em "Adicionar projeto" primeiro.
// `ok: false` significa "tem rascunho pela metade, não dá pra seguir" — o
// próprio picker já avisou o motivo em toast.
type PickerHandle = { commit: () => Promise<{ ok: boolean; id: string }> };

// One dialog, four tabs, instead of separate dialogs behind a dropdown menu
// — and every "pick an existing X" select also offers "+ Criar novo X"
// inline, so you never have to close this panel, go create the
// client/project you're missing, then start over.
export function CreatePanel({
  open,
  tab,
  onTabChange,
  onClose,
  clients: initialClients,
  users,
  projects: initialProjects,
  currentUserId,
}: {
  open: boolean;
  tab: CreateTab;
  onTabChange: (tab: CreateTab) => void;
  onClose: () => void;
  clients: ClientLite[];
  users: UserLite[];
  projects: ProjectLite[];
  currentUserId: string;
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

  // Fechar clicando fora (ou no X, ou no Esc) apagava tudo que tinha sido
  // digitado, sem aviso — o jeito mais fácil de perder um cadastro inteiro
  // por um clique torto. Agora, se tem coisa preenchida, perguntamos antes
  // e oferecemos salvar. Os três caminhos de fechar passam pelo mesmo
  // onOpenChange do Radix, então uma trava só cobre todos.
  const [dirty, setDirty] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const handleDirty = React.useCallback((d: boolean) => setDirty(d), []);

  React.useEffect(() => {
    if (open) setDirty(false);
  }, [open]);

  function finish() {
    setDirty(false);
    setConfirmOpen(false);
    onClose();
    router.refresh();
  }

  function requestClose() {
    if (dirty) setConfirmOpen(true);
    else onClose();
  }

  function discardAndClose() {
    setConfirmOpen(false);
    setDirty(false);
    onClose();
  }

  // requestSubmit() (e não submit()) de propósito: dispara a validação
  // nativa do navegador, então se faltar um campo obrigatório o próprio
  // campo é apontado em vez de sair fechando e perdendo o resto.
  function saveAndClose() {
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && requestClose()}>
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
              <ClientForm
                formRef={formRef}
                onDirty={handleDirty}
                onCreated={(c) => { addClient(c); toast.success("Cliente criado."); finish(); }}
              />
            </TabsContent>

            <TabsContent value="projeto">
              <ProjectForm formRef={formRef} onDirty={handleDirty} clients={clients} onAddClient={addClient} />
            </TabsContent>

            <TabsContent value="video">
              <VideoForm
                formRef={formRef}
                onDirty={handleDirty}
                projects={projects}
                clients={clients}
                users={users}
                currentUserId={currentUserId}
                onAddClient={addClient}
                onAddProject={addProject}
                onCreated={(count) => { toast.success(count && count > 1 ? `${count} vídeos criados.` : "Vídeo criado."); finish(); }}
              />
            </TabsContent>

            <TabsContent value="captacao">
              <CaptureForm
                formRef={formRef}
                onDirty={handleDirty}
                projects={projects}
                clients={clients}
                users={users}
                currentUserId={currentUserId}
                onAddClient={addClient}
                onAddProject={addProject}
                onCreated={() => { toast.success("Captação agendada."); finish(); }}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={(v) => !v && setConfirmOpen(false)}>
        <DialogContent className="max-w-sm" showClose={false}>
          <DialogHeader>
            <DialogTitle>Sair sem salvar?</DialogTitle>
            <DialogDescription>
              Você preencheu dados que ainda não foram cadastrados. Se sair agora, eles se perdem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>Continuar editando</Button>
            <Button type="button" variant="outline" className="text-red-600" onClick={discardAndClose}>Descartar</Button>
            <Button type="button" onClick={saveAndClose}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FormBase = { formRef: React.RefObject<HTMLFormElement | null>; onDirty: (dirty: boolean) => void };

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
function ClientForm({ formRef, onDirty, onCreated }: FormBase & { onCreated: (c: ClientLite) => void }) {
  const [name, setName] = React.useState("");
  const [tradeName, setTradeName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    onDirty(Boolean(name.trim() || tradeName.trim() || contactName.trim() || email.trim() || whatsapp.trim()));
  }, [name, tradeName, contactName, email, whatsapp, onDirty]);

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
    else toast.error("Não foi possível criar o cliente.");
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-3">
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
// create one on the spot. O cadastro em si só acontece no commit() — ver
// PickerHandle lá em cima.
const ClientPicker = React.forwardRef<
  PickerHandle,
  {
    clients: ClientLite[];
    value: string;
    onChange: (id: string) => void;
    onCreated: (c: ClientLite) => void;
    onDraft?: (hasDraft: boolean) => void;
  }
>(function ClientPicker({ clients, value, onChange, onCreated, onDraft }, ref) {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    onDraft?.(creating && !!name.trim());
  }, [creating, name, onDraft]);

  React.useImperativeHandle(ref, () => ({
    async commit() {
      if (!creating || !name.trim()) return { ok: true, id: value };
      const fd = new FormData();
      fd.set("name", name.trim());
      const id = await createClient(fd);
      if (!id) {
        toast.error("Não foi possível criar o cliente.");
        return { ok: false, id: "" };
      }
      onCreated({ id, name: name.trim() });
      onChange(id);
      setCreating(false);
      setName("");
      return { ok: true, id };
    },
  }));

  if (creating) {
    return (
      <div className="space-y-1.5">
        <Input autoFocus placeholder="Nome do novo cliente" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-cf-text-dim flex-1">Cadastrado junto ao salvar.</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setCreating(false); setName(""); }}>
            Cancelar
          </Button>
        </div>
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
});

// ---------------------------------------------------------------------------
// Projeto
// ---------------------------------------------------------------------------
function ProjectForm({
  formRef,
  onDirty,
  clients,
  onAddClient,
}: FormBase & { clients: ClientLite[]; onAddClient: (c: ClientLite) => void }) {
  const [name, setName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [clientDraft, setClientDraft] = React.useState(false);
  const [type, setType] = React.useState("Outros");
  const [priority, setPriority] = React.useState("NORMAL");
  const [description, setDescription] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const clientRef = React.useRef<PickerHandle>(null);
  const handleClientDraft = React.useCallback((d: boolean) => setClientDraft(d), []);

  React.useEffect(() => {
    onDirty(Boolean(name.trim() || clientId || description.trim() || clientDraft));
  }, [name, clientId, description, clientDraft, onDirty]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;
    setPending(true);

    // Cliente digitado inline vira cadastro aqui, antes do projeto.
    const client = await clientRef.current!.commit();
    if (!client.ok) return setPending(false);
    if (!client.id) {
      toast.error("Escolha (ou cadastre) o cliente do projeto.");
      return setPending(false);
    }

    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("clientId", client.id);
    fd.set("type", type);
    fd.set("priority", priority);
    if (description) fd.set("description", description);
    // createProject redireciona pra página do projeto novo — é essa
    // navegação que fecha o painel, então não tem onClose() nem
    // setPending(false) no caminho de sucesso. Limpamos o "tem coisa não
    // salva" antes pra não perguntar nada durante a saída.
    onDirty(false);
    await createProject(fd);
  }

  const canSubmit = Boolean(name.trim() && (clientId || clientDraft));

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Nome do projeto</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex: Campanha Verão 2026" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <ClientPicker ref={clientRef} clients={clients} value={clientId} onChange={setClientId} onCreated={onAddClient} onDraft={handleClientDraft} />
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
        <Button type="submit" disabled={pending || !canSubmit}>{pending ? "Criando…" : "Criar projeto"}</Button>
      </DialogFooter>
    </form>
  );
}

// Seletor de projeto com cadastro embutido (nome + cliente). Igual ao
// ClientPicker: guarda o rascunho e só grava no commit(), chamado por quem
// está de fora ao salvar o vídeo/captação.
const ProjectPicker = React.forwardRef<
  PickerHandle,
  {
    projects: ProjectLite[];
    clients: ClientLite[];
    value: string;
    onChange: (id: string) => void;
    onAddProject: (p: ProjectLite) => void;
    onAddClient: (c: ClientLite) => void;
    onDraft?: (hasDraft: boolean) => void;
  }
>(function ProjectPicker({ projects, clients, value, onChange, onAddProject, onAddClient, onDraft }, ref) {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [clientDraft, setClientDraft] = React.useState(false);
  const clientRef = React.useRef<PickerHandle>(null);
  const handleClientDraft = React.useCallback((d: boolean) => setClientDraft(d), []);

  React.useEffect(() => {
    onDraft?.(creating && (!!name.trim() || !!clientId || clientDraft));
  }, [creating, name, clientId, clientDraft, onDraft]);

  React.useImperativeHandle(ref, () => ({
    async commit() {
      if (!creating || !name.trim()) return { ok: true, id: value };

      // Projeto novo precisa de cliente — e o cliente também pode ser um
      // rascunho digitado logo abaixo, então ele é cadastrado primeiro.
      const client = await clientRef.current!.commit();
      if (!client.ok) return { ok: false, id: "" };
      if (!client.id) {
        toast.error("Escolha (ou cadastre) o cliente do novo projeto.");
        return { ok: false, id: "" };
      }

      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("clientId", client.id);
      const id = await createProjectQuick(fd);
      if (!id) {
        toast.error("Não foi possível criar o projeto.");
        return { ok: false, id: "" };
      }
      onAddProject({ id, name: name.trim(), clientId: client.id });
      onChange(id);
      setCreating(false);
      setName("");
      setClientId("");
      return { ok: true, id };
    },
  }));

  if (creating) {
    return (
      <div className="rounded-lg border border-cf-border bg-cf-surface-2 p-3 space-y-2.5">
        <div className="text-xs font-semibold text-cf-text-dim">Novo projeto</div>
        <Input autoFocus placeholder="Nome do projeto" value={name} onChange={(e) => setName(e.target.value)} />
        <ClientPicker ref={clientRef} clients={clients} value={clientId} onChange={setClientId} onCreated={onAddClient} onDraft={handleClientDraft} />
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-cf-text-dim flex-1">Cadastrado junto ao salvar.</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setCreating(false); setName(""); setClientId(""); }}>
            Cancelar
          </Button>
        </div>
      </div>
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
});

// ---------------------------------------------------------------------------
// Vídeo
// ---------------------------------------------------------------------------
function VideoForm({
  formRef,
  onDirty,
  projects,
  clients,
  users,
  onAddClient,
  onAddProject,
  onCreated,
  currentUserId,
}: FormBase & {
  projects: ProjectLite[];
  clients: ClientLite[];
  users: UserLite[];
  onAddClient: (c: ClientLite) => void;
  onAddProject: (p: ProjectLite) => void;
  onCreated: (count?: number) => void;
  currentUserId: string;
}) {
  const [projectId, setProjectId] = React.useState("__none__");
  const [projectDraft, setProjectDraft] = React.useState(false);
  const [name, setName] = React.useState("");
  const [format, setFormat] = React.useState("Reel");
  // Quem está criando já entra como responsável — dá pra trocar aqui mesmo
  // ou depois (menu de botão direito no card / ficha do vídeo). O que não
  // dá é deixar em branco: vídeo sem dono some da fila de todo mundo.
  const [editorId, setEditorId] = React.useState(currentUserId);
  const [finalDeadline, setFinalDeadline] = React.useState("");
  const [estimatedHours, setEstimatedHours] = React.useState("4");
  // Criar vários vídeos de uma vez, todos no mesmo projeto — em vez de
  // repetir esse formulário 15 vezes pra 15 vídeos do mesmo lote (ex.:
  // "Reel 01" a "Reel 15"). Os nomes finais saem numerados a partir do
  // "nome base" digitado acima; renomeia depois um por um (lápis na ficha
  // do vídeo) se algum precisar de nome diferente do padrão.
  const [bulkMode, setBulkMode] = React.useState(false);
  const [quantity, setQuantity] = React.useState("5");
  const [pending, setPending] = React.useState(false);
  const projectRef = React.useRef<PickerHandle>(null);
  const handleProjectDraft = React.useCallback((d: boolean) => setProjectDraft(d), []);

  const quantityNum = Math.floor(Number(quantity));
  const quantityValid = Number.isFinite(quantityNum) && quantityNum >= 2 && quantityNum <= 100;

  React.useEffect(() => {
    onDirty(Boolean(name.trim() || finalDeadline || editorId !== currentUserId || projectId !== "__none__" || projectDraft));
  }, [name, finalDeadline, editorId, currentUserId, projectId, projectDraft, onDirty]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !finalDeadline || pending) return;
    if (bulkMode && !quantityValid) {
      toast.error("Escolha uma quantidade entre 2 e 100.");
      return;
    }
    setPending(true);

    // Projeto (e o cliente dele) digitados inline são cadastrados aqui,
    // antes do vídeo — é isso que dispensa o "Adicionar projeto".
    const project = await projectRef.current!.commit();
    if (!project.ok) return setPending(false);

    const fd = new FormData();
    if (project.id && project.id !== "__none__") fd.set("projectId", project.id);
    fd.set("name", name.trim());
    fd.set("format", format);
    if (editorId) fd.set("editorId", editorId);
    fd.set("finalDeadline", finalDeadline);
    fd.set("estimatedHours", estimatedHours);

    if (bulkMode) {
      fd.set("quantity", String(quantityNum));
      const result = await createVideosBulk(fd);
      setPending(false);
      if (result) onCreated(result.ids.length);
      else toast.error("Não foi possível criar os vídeos.");
      return;
    }

    const id = await createVideo(fd);
    setPending(false);
    if (id) onCreated(1);
    else toast.error("Não foi possível criar o vídeo.");
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Projeto</Label>
        <ProjectPicker
          ref={projectRef}
          projects={projects}
          clients={clients}
          value={projectId}
          onChange={setProjectId}
          onAddProject={onAddProject}
          onAddClient={onAddClient}
          onDraft={handleProjectDraft}
        />
        <p className="text-[11px] text-cf-text-dim">Pode deixar &quot;Sem projeto&quot; e vincular depois.</p>
      </div>

      {/* Lote — cria N vídeos de uma vez no mesmo projeto (ex.: 15 reels de
          uma campanha), em vez de repetir esse formulário 15 vezes. Os
          outros campos (formato, responsável, prazo, horas) valem
          igualmente pra todos os vídeos do lote. */}
      <div className="flex items-center gap-2.5 rounded-lg border border-cf-border bg-cf-surface-2 px-3 py-2.5">
        <Checkbox id="v-bulk" checked={bulkMode} onCheckedChange={(v) => setBulkMode(!!v)} />
        <Label htmlFor="v-bulk" className="flex flex-1 cursor-pointer items-center gap-1.5 text-sm font-normal">
          <Layers className="h-3.5 w-3.5 text-cf-text-dim" />
          Criar vários vídeos de uma vez
        </Label>
        {bulkMode && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Input
              type="number"
              min={2}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-8 w-16 text-center text-sm"
            />
            <span className="text-xs text-cf-text-dim">vídeos</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="v-name">{bulkMode ? "Nome base" : "Nome do vídeo"}</Label>
        <Input
          id="v-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={bulkMode ? "Ex: Reel" : "Ex: Reel 01"}
        />
        {bulkMode && (
          <p className="text-[11px] text-cf-text-dim">
            Cria &quot;{name.trim() || "Nome"} 01&quot;, &quot;{name.trim() || "Nome"} 02&quot;… até {quantityValid ? quantityNum : "N"}.
            Renomeia cada um depois (lápis na ficha do vídeo).
          </p>
        )}
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
          <Label>Responsável</Label>
          <Select value={editorId} onValueChange={setEditorId}>
            <SelectTrigger><SelectValue placeholder="Definir responsável" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}{u.id === currentUserId ? " (você)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="v-finalDeadline">Prazo de entrega</Label>
          <DatePicker id="v-finalDeadline" value={finalDeadline} onChange={setFinalDeadline} placeholder="Escolher prazo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-estimatedHours">Horas estimadas</Label>
          <Input id="v-estimatedHours" type="number" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending || !name.trim() || !finalDeadline || (bulkMode && !quantityValid)}>
          {pending ? "Criando…" : bulkMode ? `Criar ${quantityValid ? quantityNum : ""} vídeos` : "Criar vídeo"}
        </Button>
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
  formRef,
  onDirty,
  projects,
  clients,
  users,
  onAddClient,
  onAddProject,
  onCreated,
  currentUserId,
}: FormBase & {
  projects: ProjectLite[];
  clients: ClientLite[];
  users: UserLite[];
  onAddClient: (c: ClientLite) => void;
  onAddProject: (p: ProjectLite) => void;
  onCreated: () => void;
  currentUserId: string;
}) {
  const [projectId, setProjectId] = React.useState("__none__");
  const [projectDraft, setProjectDraft] = React.useState(false);
  const [responsibleId, setResponsibleId] = React.useState(currentUserId);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [crewIds, setCrewIds] = React.useState<string[]>([]);
  const [pending, setPending] = React.useState(false);
  const projectRef = React.useRef<PickerHandle>(null);
  const handleProjectDraft = React.useCallback((d: boolean) => setProjectDraft(d), []);

  React.useEffect(() => {
    onDirty(
      Boolean(
        title.trim() || date || description.trim() || location.trim() || startTime || endTime || crewIds.length > 0 ||
          projectId !== "__none__" || projectDraft || responsibleId !== currentUserId
      )
    );
  }, [title, date, description, location, startTime, endTime, crewIds, projectId, projectDraft, responsibleId, currentUserId, onDirty]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || pending) return;
    setPending(true);

    const project = await projectRef.current!.commit();
    if (!project.ok) return setPending(false);

    const fd = new FormData();
    if (project.id && project.id !== "__none__") fd.set("projectId", project.id);
    fd.set("title", title.trim());
    if (description) fd.set("description", description);
    fd.set("date", date);
    if (startTime) fd.set("startTime", startTime);
    if (endTime) fd.set("endTime", endTime);
    if (location) fd.set("location", location);
    fd.set("responsibleId", responsibleId);
    crewIds.forEach((id) => fd.append("crewIds", id));
    const id = await createCapture(fd);
    setPending(false);
    if (id) onCreated();
    else toast.error("Não foi possível agendar a captação.");
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Projeto</Label>
        <ProjectPicker
          ref={projectRef}
          projects={projects}
          clients={clients}
          value={projectId}
          onChange={setProjectId}
          onAddProject={onAddProject}
          onAddClient={onAddClient}
          onDraft={handleProjectDraft}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cap-title">Título</Label>
          <Input id="cap-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="Ex: Captação — Evento de lançamento" />
        </div>
        <div className="space-y-1.5">
          <Label>Responsável</Label>
          <Select value={responsibleId} onValueChange={setResponsibleId}>
            <SelectTrigger><SelectValue placeholder="Definir responsável" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}{u.id === currentUserId ? " (você)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cap-date">Data</Label>
          <DatePicker id="cap-date" value={date} onChange={setDate} placeholder="Escolher data" />
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
