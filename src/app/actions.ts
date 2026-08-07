"use server";

import { db } from "@/db";
import {
  videos,
  checklistItems,
  comments,
  revisions,
  activityLogs,
  clients,
  projects,
  videoVersions,
  users,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth";
import { STATUS_META } from "@/lib/domain";
import { redirect } from "next/navigation";

function nowISO() {
  return new Date().toISOString();
}

async function logActivity(entityType: "PROJECT" | "VIDEO", entityId: string, action: string, detail?: string) {
  const user = await getCurrentUser();
  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    entityType,
    entityId,
    userId: user?.id,
    action,
    detail,
    createdAt: nowISO(),
  });
}

function revalidateEverywhere() {
  revalidatePath("/hoje");
  revalidatePath("/minha-edicao");
  revalidatePath("/kanban");
  revalidatePath("/videos");
  revalidatePath("/projetos");
  revalidatePath("/entregas");
  revalidatePath("/revisoes");
  revalidatePath("/equipe");
}

// ---------------------------------------------------------------------------
// Identity switcher (stand-in for real auth — see src/lib/auth.ts)
// ---------------------------------------------------------------------------
export async function switchUser(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, userId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Video status / Kanban
// ---------------------------------------------------------------------------
export async function updateVideoStatus(videoId: string, newStatus: string) {
  const video = await db.query.videos.findFirst({ where: eq(videos.id, videoId) });
  if (!video) return;
  const oldStatus = video.status;
  if (oldStatus === newStatus) return;

  await db.update(videos).set({ status: newStatus, updatedAt: nowISO() }).where(eq(videos.id, videoId));

  const oldLabel = STATUS_META[oldStatus]?.label ?? oldStatus;
  const newLabel = STATUS_META[newStatus]?.label ?? newStatus;
  await logActivity("VIDEO", videoId, "Status atualizado", `Movido de "${oldLabel}" para "${newLabel}".`);

  revalidateEverywhere();
  revalidatePath(`/projetos/${video.projectId}`);
}

export async function updateVideoField(
  videoId: string,
  field: "priority" | "editorId" | "estimatedHours" | "finalDeadline" | "internalDeadline" | "notes" | "currentVersion",
  value: string | number | null
) {
  const video = await db.query.videos.findFirst({ where: eq(videos.id, videoId) });
  if (!video) return;

  await db
    .update(videos)
    .set({ [field]: value, updatedAt: nowISO() } as any)
    .where(eq(videos.id, videoId));

  await logActivity("VIDEO", videoId, "Campo atualizado", `${field} atualizado.`);
  revalidateEverywhere();
  revalidatePath(`/projetos/${video.projectId}`);
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------
export async function toggleChecklistItem(itemId: string, done: boolean) {
  const item = await db.query.checklistItems.findFirst({ where: eq(checklistItems.id, itemId) });
  if (!item) return;
  await db.update(checklistItems).set({ done }).where(eq(checklistItems.id, itemId));
  await logActivity("VIDEO", item.videoId, done ? "Item do checklist concluído" : "Item do checklist reaberto", item.label);
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
export async function addComment(videoId: string, body: string) {
  if (!body.trim()) return;
  const user = await getCurrentUser();
  await db.insert(comments).values({
    id: crypto.randomUUID(),
    videoId,
    authorId: user.id,
    body: body.trim(),
    createdAt: nowISO(),
  });
  await logActivity("VIDEO", videoId, "Comentário adicionado");
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Revisions / alterations
// ---------------------------------------------------------------------------
export async function addRevision(input: {
  videoId: string;
  description: string;
  type: "INTERNA" | "CLIENTE";
  assignedToId?: string | null;
  dueAt?: string | null;
}) {
  const video = await db.query.videos.findFirst({ where: eq(videos.id, input.videoId) });
  if (!video) return;

  const nextNumber = video.revisionCount + 1;

  await db.insert(revisions).values({
    id: crypto.randomUUID(),
    videoId: input.videoId,
    number: nextNumber,
    type: input.type,
    description: input.description,
    assignedToId: input.assignedToId ?? video.editorId,
    dueAt: input.dueAt ?? null,
    versionLabel: video.currentVersion ?? undefined,
    status: "ABERTA",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });

  await db
    .update(videos)
    .set({
      revisionCount: nextNumber,
      status: input.type === "CLIENTE" ? "ALTERACAO_SOLICITADA" : "CORRECAO_INTERNA",
      updatedAt: nowISO(),
    })
    .where(eq(videos.id, input.videoId));

  await logActivity(
    "VIDEO",
    input.videoId,
    input.type === "CLIENTE" ? "Alteração solicitada pelo cliente" : "Correção interna solicitada",
    input.description
  );

  revalidateEverywhere();
  revalidatePath(`/projetos/${video.projectId}`);
}

export async function resolveRevision(revisionId: string) {
  const rev = await db.query.revisions.findFirst({ where: eq(revisions.id, revisionId) });
  if (!rev) return;
  await db.update(revisions).set({ status: "CONCLUIDA", updatedAt: nowISO() }).where(eq(revisions.id, revisionId));
  await db.update(videos).set({ status: "EM_ALTERACAO", updatedAt: nowISO() }).where(eq(videos.id, rev.videoId));
  await logActivity("VIDEO", rev.videoId, "Alteração concluída", rev.description);
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Video versions
// ---------------------------------------------------------------------------
export async function addVideoVersion(videoId: string, label: string, notes?: string) {
  const user = await getCurrentUser();
  await db.insert(videoVersions).values({
    id: crypto.randomUUID(),
    videoId,
    label,
    sentById: user.id,
    sentAt: nowISO(),
    notes: notes || null,
  });
  await db.update(videos).set({ currentVersion: label, updatedAt: nowISO() }).where(eq(videos.id, videoId));
  await logActivity("VIDEO", videoId, "Nova versão enviada", label);
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Create entities (Quick Add — spec section 32)
// ---------------------------------------------------------------------------
export async function createClient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const id = crypto.randomUUID();
  await db.insert(clients).values({
    id,
    name,
    tradeName: String(formData.get("tradeName") || "") || null,
    company: String(formData.get("company") || "") || null,
    contactName: String(formData.get("contactName") || "") || null,
    email: String(formData.get("email") || "") || null,
    whatsapp: String(formData.get("whatsapp") || "") || null,
    color: String(formData.get("color") || "#C6FF00"),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });
  revalidatePath("/clientes");
  return id;
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const clientId = String(formData.get("clientId") || "");
  const deadline = String(formData.get("deadline") || "");
  if (!name || !clientId || !deadline) return;

  const user = await getCurrentUser();
  const id = crypto.randomUUID();
  const deadlineISO = new Date(deadline).toISOString();

  await db.insert(projects).values({
    id,
    clientId,
    name,
    type: String(formData.get("type") || "Outros"),
    description: String(formData.get("description") || "") || null,
    deadline: deadlineISO,
    originalDeadline: deadlineISO,
    priority: String(formData.get("priority") || "NORMAL"),
    status: "EM_ANDAMENTO",
    producerId: user.id,
    leadEditorId: String(formData.get("leadEditorId") || "") || null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });

  await logActivity("PROJECT", id, "Projeto criado", `${user.name} criou o projeto "${name}".`);
  revalidatePath("/projetos");
  redirect(`/projetos/${id}`);
}

export async function createVideo(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  const finalDeadline = String(formData.get("finalDeadline") || "");
  if (!projectId || !name || !finalDeadline) return;

  const finalISO = new Date(finalDeadline).toISOString();
  const id = crypto.randomUUID();

  await db.insert(videos).values({
    id,
    projectId,
    name,
    format: String(formData.get("format") || "Horizontal"),
    aspectRatio: String(formData.get("aspectRatio") || "16:9"),
    editorId: String(formData.get("editorId") || "") || null,
    estimatedHours: Number(formData.get("estimatedHours") || 4),
    priority: String(formData.get("priority") || "NORMAL"),
    finalDeadline: finalISO,
    originalFinalDeadline: finalISO,
    internalDeadline: finalISO,
    status: "BACKLOG",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });

  const defaultChecklist = [
    "Ingest dos arquivos",
    "Organização",
    "Montagem",
    "Trilha sonora",
    "Colorização",
    "Sound design",
    "Motion / grafismos",
    "Legendas",
    "Revisão",
    "Exportação",
    "Upload / envio",
  ];
  await db.insert(checklistItems).values(
    defaultChecklist.map((label, i) => ({ id: crypto.randomUUID(), videoId: id, label, order: i, done: false }))
  );

  await logActivity("VIDEO", id, "Vídeo criado", name);
  revalidateEverywhere();
  revalidatePath(`/projetos/${projectId}`);
  return id;
}
