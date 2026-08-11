// Raw Postgres rows come back from the Supabase client in snake_case
// (PostgREST convention). These mappers translate to the camelCase shapes
// every component/action in the app already expects — this is the ONLY
// place that needs to know about snake_case columns.
import type {
  User,
  Client,
  Project,
  Video,
  VideoVersion,
  Revision,
  ChecklistItem,
  Comment,
  ActivityLog,
  ProjectLink,
  WorkloadEntry,
  Capture,
  Invite,
} from "./schema";

export function mapUser(r: any): User | null {
  if (!r) return null;
  return {
    id: r.id,
    supabaseUserId: r.supabase_user_id,
    name: r.name,
    email: r.email,
    avatarColor: r.avatar_color,
    avatarUrl: r.avatar_url ?? null,
    icsToken: r.ics_token ?? null,
    role: r.role,
    dailyCapacityHours: r.daily_capacity_hours,
    workDays: r.work_days,
    active: r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapClient(r: any): Client | null {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    tradeName: r.trade_name,
    company: r.company,
    contactName: r.contact_name,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    notes: r.notes,
    color: r.color,
    active: r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapProject(r: any): (Project & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name,
    description: r.description,
    type: r.type,
    captureDate: r.capture_date,
    startDate: r.start_date,
    deadline: r.deadline,
    originalDeadline: r.original_deadline,
    deadlineChangeReason: r.deadline_change_reason,
    producerId: r.producer_id,
    leadEditorId: r.lead_editor_id,
    priority: r.priority,
    status: r.status,
    notes: r.notes,
    driveUrl: r.drive_url,
    dropboxUrl: r.dropbox_url,
    frameioUrl: r.frameio_url,
    budget: r.budget,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? null,
    // Embedded relations (present only when requested via .select())
    ...(r.client !== undefined ? { client: mapClient(r.client) } : {}),
    ...(r.producer !== undefined ? { producer: mapUser(r.producer) } : {}),
    ...(r.leadEditor !== undefined ? { leadEditor: mapUser(r.leadEditor) } : {}),
    ...(r.videos !== undefined ? { videos: r.videos.map(mapVideo) } : {}),
    ...(r.links !== undefined ? { links: r.links.map(mapProjectLink) } : {}),
  };
}

export function mapVideo(r: any): (Video & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    format: r.format,
    aspectRatio: r.aspect_ratio,
    resolution: r.resolution,
    durationEstimateSec: r.duration_estimate_sec,
    editorId: r.editor_id,
    approverId: r.approver_id,
    plannedStartDate: r.planned_start_date,
    internalDeadline: r.internal_deadline,
    reviewDeadline: r.review_deadline,
    clientDeadline: r.client_deadline,
    finalDeadline: r.final_deadline,
    originalFinalDeadline: r.original_final_deadline,
    priority: r.priority,
    complexity: r.complexity,
    estimatedHours: r.estimated_hours,
    actualHours: r.actual_hours,
    status: r.status,
    revisionCount: r.revision_count,
    currentVersion: r.current_version,
    notes: r.notes,
    fileUrl: r.file_url,
    frameioUrl: r.frameio_url,
    driveUrl: r.drive_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? null,
    ...(r.project !== undefined ? { project: mapProject(r.project) } : {}),
    ...(r.editor !== undefined ? { editor: mapUser(r.editor) } : {}),
    ...(r.approver !== undefined ? { approver: mapUser(r.approver) } : {}),
    ...(r.checklist !== undefined ? { checklist: r.checklist.map(mapChecklistItem) } : {}),
    ...(r.versions !== undefined ? { versions: r.versions.map(mapVideoVersion) } : {}),
    ...(r.revisions !== undefined ? { revisions: r.revisions.map(mapRevision) } : {}),
    ...(r.comments !== undefined ? { comments: r.comments.map(mapComment) } : {}),
  };
}

export function mapVideoVersion(r: any): VideoVersion | null {
  if (!r) return null;
  return {
    id: r.id,
    videoId: r.video_id,
    label: r.label,
    fileUrl: r.file_url,
    sentAt: r.sent_at,
    sentById: r.sent_by_id,
    notes: r.notes,
  };
}

export function mapRevision(r: any): (Revision & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    videoId: r.video_id,
    number: r.number,
    type: r.type,
    description: r.description,
    requestedById: r.requested_by_id,
    assignedToId: r.assigned_to_id,
    dueAt: r.due_at,
    versionLabel: r.version_label,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...(r.assignedTo !== undefined ? { assignedTo: mapUser(r.assignedTo) } : {}),
    ...(r.requestedBy !== undefined ? { requestedBy: mapUser(r.requestedBy) } : {}),
  };
}

export function mapChecklistItem(r: any): (ChecklistItem & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    videoId: r.video_id,
    label: r.label,
    done: r.done,
    order: r.order,
    completedById: r.completed_by_id ?? null,
    completedAt: r.completed_at ?? null,
    ...(r.completedBy !== undefined ? { completedBy: mapUser(r.completedBy) } : {}),
  };
}

export function mapComment(r: any): (Comment & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    videoId: r.video_id,
    authorId: r.author_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...(r.author !== undefined ? { author: mapUser(r.author) } : {}),
  };
}

export function mapActivityLog(r: any): (ActivityLog & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    userId: r.user_id,
    action: r.action,
    detail: r.detail,
    createdAt: r.created_at,
    ...(r.user !== undefined ? { user: mapUser(r.user) } : {}),
  };
}

export function mapProjectLink(r: any): ProjectLink | null {
  if (!r) return null;
  return { id: r.id, projectId: r.project_id, category: r.category, label: r.label, url: r.url };
}

export function mapCapture(r: any): (Capture & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    location: r.location,
    crewIds: r.crew_ids ?? [],
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...(r.project !== undefined ? { project: mapProject(r.project) } : {}),
  };
}

export function mapInvite(r: any): (Invite & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    token: r.token,
    email: r.email,
    name: r.name,
    role: r.role,
    invitedById: r.invited_by_id,
    status: r.status,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    acceptedAt: r.accepted_at,
    ...(r.invitedBy !== undefined ? { invitedBy: mapUser(r.invitedBy) } : {}),
  };
}

export function mapWorkloadEntry(r: any): (WorkloadEntry & Record<string, any>) | null {
  if (!r) return null;
  return {
    id: r.id,
    editorId: r.editor_id,
    videoId: r.video_id,
    date: r.date,
    hours: r.hours,
    ...(r.editor !== undefined ? { editor: mapUser(r.editor) } : {}),
    ...(r.video !== undefined ? { video: mapVideo(r.video) } : {}),
  };
}

// Reverse direction: camelCase JS object -> snake_case row for insert/update.
// `undefined` values are dropped (so partial updates don't overwrite columns
// the caller didn't intend to touch); `null` is preserved.
const CAMEL_TO_SNAKE: Record<string, string> = {
  supabaseUserId: "supabase_user_id",
  avatarColor: "avatar_color",
  avatarUrl: "avatar_url",
  icsToken: "ics_token",
  startTime: "start_time",
  endTime: "end_time",
  crewIds: "crew_ids",
  invitedById: "invited_by_id",
  expiresAt: "expires_at",
  acceptedAt: "accepted_at",
  dailyCapacityHours: "daily_capacity_hours",
  workDays: "work_days",
  createdAt: "created_at",
  updatedAt: "updated_at",
  tradeName: "trade_name",
  contactName: "contact_name",
  clientId: "client_id",
  captureDate: "capture_date",
  startDate: "start_date",
  originalDeadline: "original_deadline",
  deadlineChangeReason: "deadline_change_reason",
  producerId: "producer_id",
  leadEditorId: "lead_editor_id",
  driveUrl: "drive_url",
  dropboxUrl: "dropbox_url",
  frameioUrl: "frameio_url",
  projectId: "project_id",
  aspectRatio: "aspect_ratio",
  durationEstimateSec: "duration_estimate_sec",
  editorId: "editor_id",
  approverId: "approver_id",
  plannedStartDate: "planned_start_date",
  internalDeadline: "internal_deadline",
  reviewDeadline: "review_deadline",
  clientDeadline: "client_deadline",
  finalDeadline: "final_deadline",
  originalFinalDeadline: "original_final_deadline",
  estimatedHours: "estimated_hours",
  actualHours: "actual_hours",
  revisionCount: "revision_count",
  currentVersion: "current_version",
  fileUrl: "file_url",
  videoId: "video_id",
  sentAt: "sent_at",
  sentById: "sent_by_id",
  requestedById: "requested_by_id",
  assignedToId: "assigned_to_id",
  dueAt: "due_at",
  versionLabel: "version_label",
  authorId: "author_id",
  authorName: "author_name",
  entityType: "entity_type",
  entityId: "entity_id",
  userId: "user_id",
  completedById: "completed_by_id",
  completedAt: "completed_at",
  deletedAt: "deleted_at",
};

export function toRow<T extends Record<string, any>>(obj: T): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const col = CAMEL_TO_SNAKE[key] ?? key;
    row[col] = value;
  }
  return row;
}
