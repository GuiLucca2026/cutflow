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
} as const;

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
};

export type Video = {
  id: string;
  projectId: string;
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
