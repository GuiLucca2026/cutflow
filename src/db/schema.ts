import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// CUTFLOW — Production / Post-Production Operating System
// Core relational schema (Phase 1: Foundation, Phase 2: Workflow)
// Modeled 1:1 against the entity list in the product spec (section 45),
// implemented on SQLite via Drizzle so the whole app runs with zero external
// accounts. The shapes below map cleanly onto Postgres/Supabase later:
// swap the dialect in drizzle.config.ts and db/index.ts, keep the schema.
// ---------------------------------------------------------------------------

function id() {
  return text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

function timestamps() {
  return {
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  };
}

// ---------------------------------------------------------------------------
// USERS / TEAM
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: id(),
  // Links this row to a real Supabase Auth user (the same auth.users the G2
  // admin panel authenticates against). Set on first login via the /sso
  // handoff from the G2 admin's "Abrir CUTFLOW" button; null for local-dev
  // demo users created by the seed script.
  supabaseUserId: text("supabase_user_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarColor: text("avatar_color").notNull().default("#C6FF00"),
  role: text("role", {
    enum: ["ADMIN", "PRODUTOR", "EDITOR", "ASSISTENTE", "FREELANCER", "VISUALIZADOR"],
  })
    .notNull()
    .default("EDITOR"),
  dailyCapacityHours: real("daily_capacity_hours").notNull().default(8),
  workDays: text("work_days").notNull().default("1,2,3,4,5"), // 0=Sun..6=Sat
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

// ---------------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------------
export const clients = sqliteTable("clients", {
  id: id(),
  name: text("name").notNull(),
  tradeName: text("trade_name"),
  company: text("company"),
  contactName: text("contact_name"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  notes: text("notes"),
  color: text("color").notNull().default("#C6FF00"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

// ---------------------------------------------------------------------------
// PROJECTS
// ---------------------------------------------------------------------------
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

export const projects = sqliteTable("projects", {
  id: id(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("Outros"),
  captureDate: text("capture_date"),
  startDate: text("start_date"),
  deadline: text("deadline").notNull(),
  originalDeadline: text("original_deadline").notNull(),
  deadlineChangeReason: text("deadline_change_reason"),
  producerId: text("producer_id").references(() => users.id),
  leadEditorId: text("lead_editor_id").references(() => users.id),
  priority: text("priority").notNull().default("NORMAL"),
  status: text("status").notNull().default("EM_ANDAMENTO"),
  notes: text("notes"),
  driveUrl: text("drive_url"),
  dropboxUrl: text("dropbox_url"),
  frameioUrl: text("frameio_url"),
  budget: real("budget"),
  ...timestamps(),
});

// ---------------------------------------------------------------------------
// VIDEOS (deliverables)
// ---------------------------------------------------------------------------
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

export const videos = sqliteTable("videos", {
  id: id(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  format: text("format").notNull().default("Horizontal"),
  aspectRatio: text("aspect_ratio").notNull().default("16:9"),
  resolution: text("resolution").default("1920x1080"),
  durationEstimateSec: integer("duration_estimate_sec"),
  editorId: text("editor_id").references(() => users.id),
  approverId: text("approver_id").references(() => users.id),

  // The date model the spec insists on — never collapse these into one
  // generic "due date".
  plannedStartDate: text("planned_start_date"),
  internalDeadline: text("internal_deadline"),
  reviewDeadline: text("review_deadline"),
  clientDeadline: text("client_deadline"),
  finalDeadline: text("final_deadline").notNull(),
  originalFinalDeadline: text("original_final_deadline").notNull(),

  priority: text("priority").notNull().default("NORMAL"),
  complexity: text("complexity", { enum: ["SIMPLES", "MEDIA", "COMPLEXA"] })
    .notNull()
    .default("MEDIA"),
  estimatedHours: real("estimated_hours").notNull().default(4),
  actualHours: real("actual_hours").notNull().default(0),

  status: text("status").notNull().default("BACKLOG"),
  revisionCount: integer("revision_count").notNull().default(0),
  currentVersion: text("current_version").default("—"),

  notes: text("notes"),
  fileUrl: text("file_url"),
  frameioUrl: text("frameio_url"),
  driveUrl: text("drive_url"),

  ...timestamps(),
});

// ---------------------------------------------------------------------------
// VIDEO VERSIONS
// ---------------------------------------------------------------------------
export const videoVersions = sqliteTable("video_versions", {
  id: id(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // V1, V2, FINAL, FINAL 2...
  fileUrl: text("file_url"),
  sentAt: text("sent_at").notNull().default(sql`(current_timestamp)`),
  sentById: text("sent_by_id").references(() => users.id),
  notes: text("notes"),
});

// ---------------------------------------------------------------------------
// REVISIONS / ALTERATIONS requested by internal team or client
// ---------------------------------------------------------------------------
export const revisions = sqliteTable("revisions", {
  id: id(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  type: text("type", { enum: ["INTERNA", "CLIENTE"] }).notNull(),
  description: text("description").notNull(),
  requestedById: text("requested_by_id").references(() => users.id),
  assignedToId: text("assigned_to_id").references(() => users.id),
  dueAt: text("due_at"),
  versionLabel: text("version_label"),
  status: text("status", { enum: ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA"] })
    .notNull()
    .default("ABERTA"),
  ...timestamps(),
});

// ---------------------------------------------------------------------------
// CHECKLIST
// ---------------------------------------------------------------------------
export const checklistItems = sqliteTable("checklist_items", {
  id: id(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  order: integer("order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// COMMENTS
// ---------------------------------------------------------------------------
export const comments = sqliteTable("comments", {
  id: id(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id),
  authorName: text("author_name"), // used for "client" pseudo-comments
  body: text("body").notNull(),
  ...timestamps(),
});

// ---------------------------------------------------------------------------
// ACTIVITY LOG — append-only history (spec section 18)
// ---------------------------------------------------------------------------
export const activityLogs = sqliteTable("activity_logs", {
  id: id(),
  entityType: text("entity_type", { enum: ["PROJECT", "VIDEO"] }).notNull(),
  entityId: text("entity_id").notNull(),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  detail: text("detail"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// PROJECT LINKS (footage / edit / delivery / references)
// ---------------------------------------------------------------------------
export const projectLinks = sqliteTable("project_links", {
  id: id(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  category: text("category", {
    enum: ["FOOTAGE", "EDICAO", "ENTREGA", "REFERENCIA"],
  }).notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
});

// ---------------------------------------------------------------------------
// WORKLOAD ENTRIES — used by the workload/capacity views
// ---------------------------------------------------------------------------
export const workloadEntries = sqliteTable("workload_entries", {
  id: id(),
  editorId: text("editor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: text("video_id").references(() => videos.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // yyyy-mm-dd
  hours: real("hours").notNull(),
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------
export const notifications = sqliteTable("notifications", {
  id: id(),
  userId: text("user_id").references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// SAVED VIEWS
// ---------------------------------------------------------------------------
export const savedViews = sqliteTable("saved_views", {
  id: id(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  filters: text("filters").notNull(), // JSON string
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// RELATIONS
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  editedVideos: many(videos, { relationName: "editor" }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  producer: one(users, { fields: [projects.producerId], references: [users.id] }),
  leadEditor: one(users, { fields: [projects.leadEditorId], references: [users.id] }),
  videos: many(videos),
  links: many(projectLinks),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  project: one(projects, { fields: [videos.projectId], references: [projects.id] }),
  editor: one(users, { fields: [videos.editorId], references: [users.id] }),
  approver: one(users, { fields: [videos.approverId], references: [users.id] }),
  versions: many(videoVersions),
  revisions: many(revisions),
  checklist: many(checklistItems),
  comments: many(comments),
}));

export const videoVersionsRelations = relations(videoVersions, ({ one }) => ({
  video: one(videos, { fields: [videoVersions.videoId], references: [videos.id] }),
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
  video: one(videos, { fields: [revisions.videoId], references: [videos.id] }),
  requestedBy: one(users, { fields: [revisions.requestedById], references: [users.id] }),
  assignedTo: one(users, { fields: [revisions.assignedToId], references: [users.id] }),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  video: one(videos, { fields: [checklistItems.videoId], references: [videos.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  video: one(videos, { fields: [comments.videoId], references: [videos.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const projectLinksRelations = relations(projectLinks, ({ one }) => ({
  project: one(projects, { fields: [projectLinks.projectId], references: [projects.id] }),
}));

export const workloadEntriesRelations = relations(workloadEntries, ({ one }) => ({
  editor: one(users, { fields: [workloadEntries.editorId], references: [users.id] }),
  video: one(videos, { fields: [workloadEntries.videoId], references: [videos.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));
