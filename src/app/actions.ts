"use server";

import { getSupabase } from "@/db";
import { TABLES } from "@/db/schema";
import { toRow } from "@/db/mappers";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth";
import { STATUS_META } from "@/lib/domain";
import { redirect } from "next/navigation";

function nowISO() {
  return new Date().toISOString();
}

async function logActivity(entityType: "PROJECT" | "VIDEO", entityId: string, action: string, detail?: string) {
  const supabase = await getSupabase();
  const user = await getCurrentUser();
  await supabase.from(TABLES.activityLogs).insert(
    toRow({
      id: crypto.randomUUID(),
      entityType,
      entityId,
      userId: user?.id,
      action,
      detail,
      createdAt: nowISO(),
    })
  );
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
  const supabase = await getSupabase();
  const { data: video } = await supabase.from(TABLES.videos).select("status, project_id").eq("id", videoId).maybeSingle();
  if (!video) return;
  const oldStatus = video.status;
  if (oldStatus === newStatus) return;

  await supabase.from(TABLES.videos).update(toRow({ status: newStatus, updatedAt: nowISO() })).eq("id", videoId);

  const oldLabel = STATUS_META[oldStatus]?.label ?? oldStatus;
  const newLabel = STATUS_META[newStatus]?.label ?? newStatus;
  await logActivity("VIDEO", videoId, "Status atualizado", `Movido de "${oldLabel}" para "${newLabel}".`);

  revalidateEverywhere();
  revalidatePath(`/projetos/${video.project_id}`);
}

export async function updateVideoField(
  videoId: string,
  field: "priority" | "editorId" | "estimatedHours" | "finalDeadline" | "internalDeadline" | "notes" | "currentVersion",
  value: string | number | null
) {
  const supabase = await getSupabase();
  const { data: video } = await supabase.from(TABLES.videos).select("project_id").eq("id", videoId).maybeSingle();
  if (!video) return;

  await supabase
    .from(TABLES.videos)
    .update(toRow({ [field]: value, updatedAt: nowISO() }))
    .eq("id", videoId);

  await logActivity("VIDEO", videoId, "Campo atualizado", `${field} atualizado.`);
  revalidateEverywhere();
  revalidatePath(`/projetos/${video.project_id}`);
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------
export async function toggleChecklistItem(itemId: string, done: boolean) {
  const supabase = await getSupabase();
  const { data: item } = await supabase.from(TABLES.checklistItems).select("video_id, label").eq("id", itemId).maybeSingle();
  if (!item) return;
  await supabase.from(TABLES.checklistItems).update({ done }).eq("id", itemId);
  await logActivity("VIDEO", item.video_id, done ? "Item do checklist concluído" : "Item do checklist reaberto", item.label);
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
export async function addComment(videoId: string, body: string) {
  if (!body.trim()) return;
  const supabase = await getSupabase();
  const user = await getCurrentUser();
  await supabase.from(TABLES.comments).insert(
    toRow({
      id: crypto.randomUUID(),
      videoId,
      authorId: user.id,
      body: body.trim(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
  );
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
  const supabase = await getSupabase();
  const { data: video } = await supabase
    .from(TABLES.videos)
    .select("revision_count, editor_id, current_version, project_id")
    .eq("id", input.videoId)
    .maybeSingle();
  if (!video) return;

  const nextNumber = video.revision_count + 1;

  await supabase.from(TABLES.revisions).insert(
    toRow({
      id: crypto.randomUUID(),
      videoId: input.videoId,
      number: nextNumber,
      type: input.type,
      description: input.description,
      assignedToId: input.assignedToId ?? video.editor_id,
      dueAt: input.dueAt ?? null,
      versionLabel: video.current_version ?? undefined,
      status: "ABERTA",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
  );

  await supabase
    .from(TABLES.videos)
    .update(
      toRow({
        revisionCount: nextNumber,
        status: input.type === "CLIENTE" ? "ALTERACAO_SOLICITADA" : "CORRECAO_INTERNA",
        updatedAt: nowISO(),
      })
    )
    .eq("id", input.videoId);

  await logActivity(
    "VIDEO",
    input.videoId,
    input.type === "CLIENTE" ? "Alteração solicitada pelo cliente" : "Correção interna solicitada",
    input.description
  );

  revalidateEverywhere();
  revalidatePath(`/projetos/${video.project_id}`);
}

export async function resolveRevision(revisionId: string) {
  const supabase = await getSupabase();
  const { data: rev } = await supabase.from(TABLES.revisions).select("video_id, description").eq("id", revisionId).maybeSingle();
  if (!rev) return;
  await supabase.from(TABLES.revisions).update(toRow({ status: "CONCLUIDA", updatedAt: nowISO() })).eq("id", revisionId);
  await supabase.from(TABLES.videos).update(toRow({ status: "EM_ALTERACAO", updatedAt: nowISO() })).eq("id", rev.video_id);
  await logActivity("VIDEO", rev.video_id, "Alteração concluída", rev.description);
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Video versions
// ---------------------------------------------------------------------------
export async function addVideoVersion(videoId: string, label: string, notes?: string) {
  const supabase = await getSupabase();
  const user = await getCurrentUser();
  await supabase.from(TABLES.videoVersions).insert(
    toRow({
      id: crypto.randomUUID(),
      videoId,
      label,
      sentById: user.id,
      sentAt: nowISO(),
      notes: notes || null,
    })
  );
  await supabase.from(TABLES.videos).update(toRow({ currentVersion: label, updatedAt: nowISO() })).eq("id", videoId);
  await logActivity("VIDEO", videoId, "Nova versão enviada", label);
  revalidateEverywhere();
}

// ---------------------------------------------------------------------------
// Create entities (Quick Add — spec section 32)
// ---------------------------------------------------------------------------
export async function createClient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const supabase = await getSupabase();
  const id = crypto.randomUUID();
  await supabase.from(TABLES.clients).insert(
    toRow({
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
    })
  );
  revalidatePath("/clientes");
  return id;
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const clientId = String(formData.get("clientId") || "");
  const deadline = String(formData.get("deadline") || "");
  if (!name || !clientId || !deadline) return;

  const supabase = await getSupabase();
  const user = await getCurrentUser();
  const id = crypto.randomUUID();
  const deadlineISO = new Date(deadline).toISOString();

  await supabase.from(TABLES.projects).insert(
    toRow({
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
    })
  );

  await logActivity("PROJECT", id, "Projeto criado", `${user.name} criou o projeto "${name}".`);
  revalidatePath("/projetos");
  redirect(`/projetos/${id}`);
}

export async function createVideo(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  const finalDeadline = String(formData.get("finalDeadline") || "");
  if (!projectId || !name || !finalDeadline) return;

  const supabase = await getSupabase();
  const finalISO = new Date(finalDeadline).toISOString();
  const id = crypto.randomUUID();

  await supabase.from(TABLES.videos).insert(
    toRow({
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
    })
  );

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
  await supabase.from(TABLES.checklistItems).insert(
    defaultChecklist.map((label, i) => toRow({ id: crypto.randomUUID(), videoId: id, label, order: i, done: false }))
  );

  await logActivity("VIDEO", id, "Vídeo criado", name);
  revalidateEverywhere();
  revalidatePath(`/projetos/${projectId}`);
  return id;
}
