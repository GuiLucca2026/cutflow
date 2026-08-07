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

// Shifts every date field on a video by the same number of days — used by
// the Timeline/Gantt drag-and-drop (src/components/cutflow/timeline-gantt.tsx)
// to "move the whole bar" while preserving the spacing between internal,
// review, client and final deadlines. originalFinalDeadline is left
// untouched on purpose (Deadline Lock — it's the historical reference, not
// used in overdue/risk math, which always reads finalDeadline).
export async function rescheduleVideo(videoId: string, dayDelta: number) {
  if (!dayDelta) return;
  const supabase = await getSupabase();
  const { data: video } = await supabase
    .from(TABLES.videos)
    .select("project_id, internal_deadline, review_deadline, client_deadline, final_deadline, planned_start_date")
    .eq("id", videoId)
    .maybeSingle();
  if (!video) return;

  const shiftISO = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + dayDelta * 86400000).toISOString() : iso);
  const shiftDate = (d: string | null) => (d ? new Date(new Date(`${d}T00:00:00`).getTime() + dayDelta * 86400000).toISOString().slice(0, 10) : d);

  await supabase
    .from(TABLES.videos)
    .update(
      toRow({
        plannedStartDate: shiftDate(video.planned_start_date),
        internalDeadline: shiftISO(video.internal_deadline),
        reviewDeadline: shiftISO(video.review_deadline),
        clientDeadline: shiftISO(video.client_deadline),
        finalDeadline: shiftISO(video.final_deadline),
        updatedAt: nowISO(),
      })
    )
    .eq("id", videoId);

  await logActivity(
    "VIDEO",
    videoId,
    "Prazo reagendado",
    `Prazos deslocados em ${dayDelta > 0 ? "+" : ""}${dayDelta} dia(s) pela Timeline.`
  );

  revalidateEverywhere();
  revalidatePath(`/projetos/${video.project_id}`);
  revalidatePath("/timeline");
  revalidatePath("/calendario");
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
// Planejar minha semana (Auto Schedule) — persists the computed plan
// (src/lib/planning.ts) as real workload_entries for the current editor.
// ---------------------------------------------------------------------------
export async function applyWeekPlan(entries: { videoId: string; date: string; hours: number }[]) {
  if (entries.length === 0) return;
  const supabase = await getSupabase();
  const user = await getCurrentUser();

  const dates = entries.map((e) => e.date).sort();
  const from = dates[0];
  const to = dates[dates.length - 1];

  // Replace this editor's entries for the planned window rather than
  // appending — re-applying the plan (e.g. after a status update changes
  // hoursRemaining) shouldn't duplicate entries.
  await supabase.from(TABLES.workloadEntries).delete().eq("editor_id", user.id).gte("date", from).lte("date", to);
  await supabase
    .from(TABLES.workloadEntries)
    .insert(entries.map((e) => toRow({ id: crypto.randomUUID(), editorId: user.id, videoId: e.videoId, date: e.date, hours: e.hours })));

  revalidatePath("/minha-semana");
  revalidatePath("/equipe");
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

// Shared by createProject (top-level "Projeto" tab, redirects to the new
// project afterward) and createProjectQuick (inline "+ Criar novo projeto"
// from inside the video form, which must NOT navigate away mid-form).
async function insertProject(formData: FormData): Promise<string | undefined> {
  const name = String(formData.get("name") || "").trim();
  const clientId = String(formData.get("clientId") || "");
  const deadline = String(formData.get("deadline") || "");
  if (!name || !clientId || !deadline) return undefined;

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
  return id;
}

export async function createProject(formData: FormData) {
  const id = await insertProject(formData);
  if (!id) return;
  redirect(`/projetos/${id}`);
}

// Used by the "+ Criar novo projeto" affordance inside the video creation
// form (src/components/cutflow/create-panel.tsx) — same insert as
// createProject, but returns the id instead of navigating away, so the
// video form the user was filling out stays open and usable.
export async function createProjectQuick(formData: FormData) {
  return insertProject(formData);
}

export async function createVideo(formData: FormData) {
  // projectId is optional — a video can be created "avulso" (standalone)
  // and attached to a project later (see supabase-setup.sql / schema.ts).
  const projectId = String(formData.get("projectId") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const finalDeadline = String(formData.get("finalDeadline") || "");
  if (!name || !finalDeadline) return;

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
  if (projectId) revalidatePath(`/projetos/${projectId}`);
  return id;
}

// ---------------------------------------------------------------------------
// Captação (Fase 4 — shoot/capture sessions, separate from video editing)
// ---------------------------------------------------------------------------
export async function createCapture(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  if (!title || !date) return;

  const projectId = String(formData.get("projectId") || "") || null;
  const crewIds = formData.getAll("crewIds").map(String).filter(Boolean);

  const supabase = await getSupabase();
  const id = crypto.randomUUID();
  await supabase.from(TABLES.captures).insert(
    toRow({
      id,
      projectId,
      title,
      description: String(formData.get("description") || "") || null,
      date,
      startTime: String(formData.get("startTime") || "") || null,
      endTime: String(formData.get("endTime") || "") || null,
      location: String(formData.get("location") || "") || null,
      crewIds,
      status: "AGENDADA",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
  );

  revalidatePath("/captacoes");
  revalidatePath("/calendario");
  if (projectId) revalidatePath(`/projetos/${projectId}`);
  return id;
}

export async function updateCaptureStatus(captureId: string, status: "AGENDADA" | "CONCLUIDA" | "CANCELADA") {
  const supabase = await getSupabase();
  await supabase.from(TABLES.captures).update(toRow({ status, updatedAt: nowISO() })).eq("id", captureId);
  revalidatePath("/captacoes");
  revalidatePath("/calendario");
}

export async function deleteCapture(captureId: string) {
  const supabase = await getSupabase();
  await supabase.from(TABLES.captures).delete().eq("id", captureId);
  revalidatePath("/captacoes");
  revalidatePath("/calendario");
}

// ---------------------------------------------------------------------------
// Perfil (nome, foto) — Storage upload em si acontece no browser (ver
// components/cutflow/profile-dialog.tsx), esta action só grava o resultado.
// ---------------------------------------------------------------------------
export async function updateOwnProfile(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") || "").trim();
  const avatarUrl = formData.get("avatarUrl");
  if (!name) return;

  const supabase = await getSupabase();
  await supabase
    .from(TABLES.users)
    .update(
      toRow({
        name,
        // Only touch avatarUrl if the form actually sent something — lets
        // a name-only save leave the current photo alone.
        ...(avatarUrl !== null ? { avatarUrl: String(avatarUrl) || null } : {}),
        updatedAt: nowISO(),
      })
    )
    .eq("id", user.id);

  revalidateEverywhere();
  revalidatePath("/equipe");
}

export async function regenerateIcsToken() {
  const user = await getCurrentUser();
  const supabase = await getSupabase();
  const token = crypto.randomUUID().replace(/-/g, "");
  await supabase.from(TABLES.users).update(toRow({ icsToken: token, updatedAt: nowISO() })).eq("id", user.id);
  revalidatePath("/hoje");
  return token;
}
