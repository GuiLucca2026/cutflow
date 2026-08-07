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
