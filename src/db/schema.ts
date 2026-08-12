// ---------------------------------------------------------------------------
// CUTFLOW — Production / Post-Production Operating System
// Shared constants + row types (spec section 45).
//
// Data lives in Postgres via the Supabase REST API (see src/db/*), NOT via
// a direct Postgres connection — the G2 site runs on "Lovable Cloud",
// which doesn't expose a raw connection string outside Lovable's own UI.
// The same URL + anon key the G2 site already uses for auth is enough to
// reach these tables too, gated by RLS (see supabase-setup.sql).
//
// Tables live in the "public" Postgres schema, prefixed "cutflow_" to
// avoid colliding with G2's own tables (which already has its own
// unrelated "videos" table, for example) — see supabase-setup.sql for the
// full DDL. Columns are snake_case (Postgres/PostgREST convention); the
// row types below and the mappers in src/db/mappers.ts translate to/from
// the camelCase shapes the rest of the app uses.
// ---------------------------------------------------------------------------

export const TABLES = {
  users: "cutflow_users",
  clients: "cutflow_clients",
  projects: "cutflow_projects",
  videos: "cutflow_videos",
  videoVersions: "cutflow_video_versions",
  revisions: "cutflow_revisions",
  checklistItems: "cutflow_checklist_items",
  comments: "cutflow_comments",
  activityLogs: "cutflow_activity_logs",
  projectLinks: "cutflow_project_links",
  workloadEntries: "cutflow_workload_entries",
  notifications: "cutflow_notifications",
  savedViews: "cutflow_saved_views",
  captures: "cutflow_captures",
  invites: "cutflow_invites",
  videoTeam: "cutflow_video_team",
  tasks: "cutflow_tasks",
} as const;

export const CAPTURE_STATUSES = ["AGENDADA", "CONCLUIDA", "CANCELADA"] as const;
export const INVITE_STATUSES = ["PENDENTE", "ACEITO", "EXPIRADO", "REVOGADO"] as const;

export const PROJECT_TYPES = [
  "Institucional",
  "Evento",
  "Publicidade",
  "Social Media",
  "Fashion Film",
  "Produto",
  "Entrevista",
  "Aftermovie",
  "Conteúdo mensal",
  "Live",
  "Outros",
] as const;

export const PROJECT_STATUSES = [
  "BACKLOG",
  "EM_ANDAMENTO",
  "EM_REVISAO",
  "AGUARDANDO_CLIENTE",
  "CONCLUIDO",
  "ARQUIVADO",
  "CANCELADO",
] as const;

export const PRIORITIES = ["BAIXA", "NORMAL", "ALTA", "URGENTE"] as const;

export const VIDEO_FORMATS = [
  "Reel",
  "Story",
  "Horizontal",
  "Vertical",
  "1:1",
  "16:9",
  "9:16",
  "4:5",
  "Teaser",
  "Trailer",
  "Aftermovie",
  "Institucional",
  "Corte curto",
  "Corte longo",
] as const;

// Ordered production pipeline — order also drives the Kanban column order
// and the progress-weight table (spec section 54).
export const VIDEO_STATUSES = [
  "BACKLOG",
  "AGUARDANDO_MATERIAL",
  "PRONTO_PARA_EDITAR",
  "EDITANDO",
  "EDICAO_PAUSADA",
  "REVISAO_INTERNA",
  "CORRECAO_INTERNA",
  "ENVIADO_AO_CLIENTE",
  "AGUARDANDO_FEEDBACK",
  "ALTERACAO_SOLICITADA",
  "EM_ALTERACAO",
  "AGUARDANDO_APROVACAO",
  "APROVADO",
  "EXPORTANDO",
  "UPLOAD_ENVIO",
  "ENTREGUE",
  "ARQUIVADO",
  "CANCELADO",
] as const;

export const STATUS_PROGRESS_WEIGHT: Record<string, number> = {
  BACKLOG: 0,
  AGUARDANDO_MATERIAL: 5,
  PRONTO_PARA_EDITAR: 10,
  EDITANDO: 30,
  EDICAO_PAUSADA: 25,
  REVISAO_INTERNA: 55,
  CORRECAO_INTERNA: 50,
  ENVIADO_AO_CLIENTE: 60,
  AGUARDANDO_FEEDBACK: 65,
  ALTERACAO_SOLICITADA: 70,
  EM_ALTERACAO: 75,
  AGUARDANDO_APROVACAO: 85,
  APROVADO: 90,
  EXPORTANDO: 94,
  UPLOAD_ENVIO: 97,
  ENTREGUE: 100,
  ARQUIVADO: 100,
  CANCELADO: 0,
};

// ---------------------------------------------------------------------------
// Row types (camelCase — what the rest of the app consumes)
// ---------------------------------------------------------------------------
export type User = {
  id: string;
  supabaseUserId: string | null;
  name: string;
  email: string;
  avatarColor: string;
  // Optional real profile photo (Supabase Storage public URL) — falls back
  // to the initials-on-color Avatar when null.
  avatarUrl: string | null;
  // Opaque per-user token for the .ics calendar subscription feed (Fase 4 —
  // Calendar Sync). Never exposed to anyone but its owner; see
  // src/app/api/ics/[token]/route.ts and the cutflow_ics_feed() SQL
  // function (supabase-setup.sql), which is the only thing allowed to read
  // by token instead of by authenticated session.
  icsToken: string | null;
  role: "ADMIN" | "PRODUTOR" | "EDITOR" | "ASSISTENTE" | "FREELANCER" | "VISUALIZADOR";
  dailyCapacityHours: number;
  workDays: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  name: string;
  tradeName: string | null;
  company: string | null;
  contactName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  notes: string | null;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  type: string;
  captureDate: string | null;
  startDate: string | null;
  // Prazo de PROJETO foi removido do produto — a única fonte de prazo
  // agora é video.finalDeadline (cada vídeo tem o seu). Estas 3 colunas
  // continuam existindo porque deadline/original_deadline são NOT NULL no
  // banco (insertProject em actions.ts preenche com a data de criação como
  // placeholder), mas nenhuma tela do app lê/mostra esses campos.
  deadline: string;
  originalDeadline: string;
  deadlineChangeReason: string | null;
  producerId: string | null;
  leadEditorId: string | null;
  priority: string;
  status: string;
  notes: string | null;
  driveUrl: string | null;
  dropboxUrl: string | null;
  frameioUrl: string | null;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  // Lixeira (soft delete) — null = ativo, normalmente. Ver
  // supabase-setup.sql "Fase 7" e as ações deleteProject/restoreProject
  // em actions.ts. listProjects() já filtra isso fora por padrão; só
  // listDeletedProjects() (usada pela página /lixeira) devolve o resto.
  deletedAt: string | null;
};

export type Video = {
  id: string;
  // Nullable — a video can exist "avulso" (standalone), not yet linked to
  // a project (see supabase-setup.sql).
  projectId: string | null;
  name: string;
  format: string;
  aspectRatio: string;
  resolution: string | null;
  durationEstimateSec: number | null;
  editorId: string | null;
  approverId: string | null;
  plannedStartDate: string | null;
  internalDeadline: string | null;
  reviewDeadline: string | null;
  clientDeadline: string | null;
  finalDeadline: string;
  originalFinalDeadline: string;
  priority: string;
  complexity: "SIMPLES" | "MEDIA" | "COMPLEXA";
  estimatedHours: number;
  actualHours: number;
  status: string;
  revisionCount: number;
  currentVersion: string | null;
  notes: string | null;
  fileUrl: string | null;
  frameioUrl: string | null;
  driveUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Quando o vídeo foi PRA MÃO DO CLIENTE (Fase 9) — gravado por
  // updateVideoStatus ao entrar num status de espera (ENVIADO_AO_CLIENTE,
  // AGUARDANDO_FEEDBACK, AGUARDANDO_APROVACAO) e limpo ao sair. É daqui
  // que sai a contagem de "sem retorno há X dias" (ver computeClientWait
  // em lib/domain.ts) — usar updatedAt pra isso seria errado, já que
  // qualquer edição no vídeo reiniciaria o relógio.
  clientSentAt: string | null;
  // Lixeira (soft delete) — ver o mesmo campo em Project acima.
  deletedAt: string | null;
};

// Equipe do vídeo (Fase 8) — colaborador ADICIONAL além do Editor
// responsável (Video.editorId), com uma função (ver TEAM_ROLE_META em
// lib/domain.ts). Mesma pessoa pode aparecer mais de uma vez no mesmo
// vídeo com funções diferentes. Ver supabase-setup.sql "Fase 8".
export type VideoTeamMember = {
  id: string;
  videoId: string;
  userId: string;
  role: string;
  createdAt: string;
};

export type VideoVersion = {
  id: string;
  videoId: string;
  label: string;
  fileUrl: string | null;
  sentAt: string;
  sentById: string | null;
  notes: string | null;
};

// A pending (or resolved) invitation to join G2 FLOW with a real login of
// its own — for people who aren't a G2 admin panel user (freelancers,
// external editors) and so can't arrive via the SSO handoff. See
// src/app/convite/[token]/page.tsx and the cutflow_invite_lookup() SQL
// function (supabase-setup.sql) for how an unauthenticated visitor can
// read just enough of this row to accept it.
export type Invite = {
  id: string;
  token: string;
  email: string;
  name: string;
  role: string;
  invitedById: string | null;
  status: (typeof INVITE_STATUSES)[number];
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
};

// A capture/shoot session — distinct from a Video: this is the "filming
// day" part of production, before there's any footage to edit. Nullable
// projectId mirrors the "vídeo avulso" pattern: a shoot can be scheduled
// before the project it belongs to even exists.
export type Capture = {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  // References into cutflow_users.id — who's expected on set.
  crewIds: string[];
  // Dono da captação (Fase 10). Quem cria assume por padrão e pode passar
  // adiante depois — ver setCaptureResponsible em actions.ts. Nullable só
  // por causa das captações criadas antes desta coluna existir.
  responsibleId: string | null;
  status: (typeof CAPTURE_STATUSES)[number];
  createdAt: string;
  updatedAt: string;
};

export type Revision = {
  id: string;
  videoId: string;
  number: number;
  type: "INTERNA" | "CLIENTE";
  description: string;
  requestedById: string | null;
  assignedToId: string | null;
  dueAt: string | null;
  versionLabel: string | null;
  status: "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA";
  createdAt: string;
  updatedAt: string;
};

export type ChecklistItem = {
  id: string;
  videoId: string;
  label: string;
  done: boolean;
  order: number;
  // Quem marcou o item como feito, e quando — null enquanto o item está
  // em aberto (ou depois de ser reaberto: a atribuição não persiste, já
  // que "quem fez" deixa de ser verdade assim que desmarca).
  completedById: string | null;
  completedAt: string | null;
  // Carga estipulada (em horas) — travada na criação do item, a partir de
  // CHECKLIST_STEPS em lib/checklist.ts. Ver o comentário lá pra por que
  // isso é um valor congelado e não um lookup dinâmico por label.
  estimatedLoadHours: number;
};

export type Comment = {
  id: string;
  videoId: string;
  authorId: string | null;
  authorName: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  entityType: "PROJECT" | "VIDEO";
  entityId: string;
  userId: string | null;
  action: string;
  detail: string | null;
  createdAt: string;
};

export type ProjectLink = {
  id: string;
  projectId: string;
  category: "FOOTAGE" | "EDICAO" | "ENTREGA" | "REFERENCIA";
  label: string;
  url: string;
};

export type WorkloadEntry = {
  id: string;
  editorId: string;
  videoId: string | null;
  date: string;
  hours: number;
};

// Tarefa avulsa (Fase 12) — ação de uma linha que não se encaixa num dos
// 11 passos fixos do checklist (ver lib/checklist.ts). Presa a um vídeo,
// a um projeto sem vídeo específico, ou às vezes os dois (tarefa de um
// vídeo específico dentro de um projeto — videoId então implica o
// projectId dele, mas guardamos os dois pra não depender de join só pra
// filtrar "tarefas deste projeto, incluindo as de vídeos específicos").
export type Task = {
  id: string;
  projectId: string | null;
  videoId: string | null;
  title: string;
  description: string | null;
  assignedToId: string | null;
  createdById: string | null;
  dueAt: string | null;
  done: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Notificação real (Fase 12) — a tabela cutflow_notifications já existia
// desde o pacote inicial (preparada, nunca usada). Dois tipos por agora:
// menção (@Nome num comentário ou numa tarefa) e atribuição de tarefa.
export const NOTIFICATION_TYPES = ["MENCAO", "TAREFA_ATRIBUIDA"] as const;
export type Notification = {
  id: string;
  userId: string;
  type: (typeof NOTIFICATION_TYPES)[number] | string;
  title: string;
  body: string | null;
  read: boolean;
  entityType: "VIDEO" | "PROJECT" | "TASK" | null;
  entityId: string | null;
  createdAt: string;
};
