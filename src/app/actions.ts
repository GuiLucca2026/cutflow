"use server";

import { getSupabase } from "@/db";
import { TABLES } from "@/db/schema";
import { toRow } from "@/db/mappers";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth";
import { STATUS_META, TEAM_ROLE_META } from "@/lib/domain";
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

export async function renameVideo(videoId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const supabase = await getSupabase();
  const { data: video } = await supabase.from(TABLES.videos).select("project_id, name").eq("id", videoId).maybeSingle();
  if (!video || video.name === trimmed) return;

  await supabase.from(TABLES.videos).update(toRow({ name: trimmed, updatedAt: nowISO() })).eq("id", videoId);
  await logActivity("VIDEO", videoId, "Renomeado", `"${video.name}" → "${trimmed}"`);
  revalidateEverywhere();
  revalidatePath(`/projetos/${video.project_id}`);
}

// ---------------------------------------------------------------------------
// Lixeira (soft delete) — atalho de botão direito no card (ver
// video-context-menu.tsx). "Excluir" nunca apaga a linha na hora, só marca
// deleted_at; listVideos()/listProjects() já filtram isso fora, então o
// item some de todo lugar exceto da própria página /lixeira, de onde dá
// pra restaurar ou apagar de vez. Ver supabase-setup.sql "Fase 7".
// ---------------------------------------------------------------------------
export async function deleteVideo(videoId: string) {
  const supabase = await getSupabase();
  const { data: video } = await supabase.from(TABLES.videos).select("project_id, name").eq("id", videoId).maybeSingle();
  if (!video) return;

  await supabase.from(TABLES.videos).update(toRow({ deletedAt: nowISO(), updatedAt: nowISO() })).eq("id", videoId);
  await logActivity("VIDEO", videoId, "Movido para a lixeira", video.name);
  revalidateEverywhere();
  revalidatePath(`/projetos/${video.project_id}`);
  revalidatePath("/lixeira");
}

export async function restoreVideo(videoId: string) {
  const supabase = await getSupabase();
  const { data: video } = await supabase.from(TABLES.videos).select("project_id, name").eq("id", videoId).maybeSingle();
  if (!video) return;

  await supabase.from(TABLES.videos).update(toRow({ deletedAt: null, updatedAt: nowISO() })).eq("id", videoId);
  await logActivity("VIDEO", videoId, "Restaurado da lixeira", video.name);
  revalidateEverywhere();
  revalidatePath(`/projetos/${video.project_id}`);
  revalidatePath("/lixeira");
}

// Exclusão definitiva — só chamada de dentro da própria Lixeira, com
// confirmação na UI (é a única ação deste arquivo que não tem volta).
export async function permanentlyDeleteVideo(videoId: string) {
  const supabase = await getSupabase();
  await supabase.from(TABLES.videos).delete().eq("id", videoId);
  revalidatePath("/lixeira");
}

export async function renameProject(projectId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const supabase = await getSupabase();
  const { data: project } = await supabase.from(TABLES.projects).select("name").eq("id", projectId).maybeSingle();
  if (!project || project.name === trimmed) return;

  await supabase.from(TABLES.projects).update(toRow({ name: trimmed, updatedAt: nowISO() })).eq("id", projectId);
  await logActivity("PROJECT", projectId, "Renomeado", `"${project.name}" → "${trimmed}"`);
  revalidateEverywhere();
  revalidatePath(`/projetos/${projectId}`);
}

// Excluir um projeto arrasta os vídeos dele junto (só os que ainda não
// estavam excluídos por conta própria) — senão eles ficariam "soltos",
// aparecendo em Vídeos/Kanban/Hoje sem o projeto que os organiza.
// Restaurar desfaz o mesmo conjunto. Caso de borda aceito: se algum desses
// vídeos tinha sido excluído individualmente ANTES do projeto, restaurar o
// projeto também restaura ele — não vale a pena guardar essa distinção só
// pra esse caso raro.
export async function deleteProject(projectId: string) {
  const supabase = await getSupabase();
  const { data: project } = await supabase.from(TABLES.projects).select("name").eq("id", projectId).maybeSingle();
  if (!project) return;

  const stamp = nowISO();
  await supabase.from(TABLES.projects).update(toRow({ deletedAt: stamp, updatedAt: stamp })).eq("id", projectId);
  await supabase
    .from(TABLES.videos)
    .update(toRow({ deletedAt: stamp, updatedAt: stamp }))
    .eq("project_id", projectId)
    .is("deleted_at", null);
  await logActivity("PROJECT", projectId, "Movido para a lixeira", project.name);
  revalidateEverywhere();
  revalidatePath("/lixeira");
}

export async function restoreProject(projectId: string) {
  const supabase = await getSupabase();
  const { data: project } = await supabase.from(TABLES.projects).select("name").eq("id", projectId).maybeSingle();
  if (!project) return;

  const stamp = nowISO();
  await supabase.from(TABLES.projects).update(toRow({ deletedAt: null, updatedAt: stamp })).eq("id", projectId);
  await supabase.from(TABLES.videos).update(toRow({ deletedAt: null, updatedAt: stamp })).eq("project_id", projectId);
  await logActivity("PROJECT", projectId, "Restaurado da lixeira", project.name);
  revalidateEverywhere();
  revalidatePath("/lixeira");
}

export async function permanentlyDeleteProject(projectId: string) {
  const supabase = await getSupabase();
  // A FK de cutflow_videos.project_id já é "on delete cascade" (ver
  // supabase-setup.sql), então apagar o projeto já levaria os vídeos
  // junto — mas apagamos explicitamente antes de qualquer jeito, só pra
  // não depender silenciosamente desse detalhe do schema.
  await supabase.from(TABLES.videos).delete().eq("project_id", projectId);
  await supabase.from(TABLES.projects).delete().eq("id", projectId);
  revalidatePath("/lixeira");
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------
export async function toggleChecklistItem(itemId: string, done: boolean) {
  const supabase = await getSupabase();
  const { data: item } = await supabase
    .from(TABLES.checklistItems)
    .select("video_id, label, video:cutflow_videos(project_id, name)")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return;

  const user = await getCurrentUser();
  const video = Array.isArray(item.video) ? item.video[0] : item.video;
  const action = done ? "Item do checklist concluído" : "Item do checklist reaberto";

  // As 3 escritas abaixo são independentes entre si (nenhuma lê o
  // resultado da outra) — rodar em paralelo em vez de uma await por vez é
  // o que faz essa ação responder rápido. logActivity() reaproveita o
  // getCurrentUser() já resolvido acima (cache() em lib/auth.ts), então
  // não repete a ida ao Auth do Supabase por chamada.
  await Promise.all([
    // Guarda quem marcou o item (e quando) — some junto se for reaberto,
    // já que "quem fez" deixa de valer assim que volta a ficar pendente.
    supabase
      .from(TABLES.checklistItems)
      .update(toRow({ done, completedById: done ? user.id : null, completedAt: done ? nowISO() : null }))
      .eq("id", itemId),
    logActivity("VIDEO", item.video_id, action, item.label),
    // Some no vídeo E no projeto (spec do usuário: "incluído no projeto
    // junto") — quem olha só a aba do projeto também precisa ver quem fez
    // qual parte, sem ter que abrir cada vídeo um por um. Vídeo avulso
    // (sem projeto) não tem pra onde propagar isso.
    video?.project_id ? logActivity("PROJECT", video.project_id, action, `${video.name} — ${item.label}`) : null,
  ]);
  // Sem revalidateEverywhere aqui de propósito: nada fora desta aba mostra
  // o checklist, então isso só custaria uma re-renderização cara (o
  // layout + a página de fundo inteiros) por nada — era exatamente essa a
  // causa da lentidão ao marcar um item.
}

// ---------------------------------------------------------------------------
// Equipe do vídeo (Fase 8) — colaboradores extras além do Editor
// responsável (editorId), cada um com uma função (Motion, Colorização,
// Trilha sonora...). Puramente aditivo/informativo: editorId continua
// sendo o único campo que Minha Edição, carga de trabalho (Planejar
// Semana) e Analytics enxergam — isso aqui é só "quem mais colaborou e em
// que papel", sem revalidateEverywhere pelo mesmo motivo do checklist e
// dos comentários (só aparece dentro da própria aba do vídeo).
// ---------------------------------------------------------------------------
export async function addTeamMember(videoId: string, userId: string, role: string) {
  if (!userId || !role) return;
  const supabase = await getSupabase();
  await supabase.from(TABLES.videoTeam).insert(
    toRow({
      id: crypto.randomUUID(),
      videoId,
      userId,
      role,
      createdAt: nowISO(),
    })
  );
  await logActivity("VIDEO", videoId, "Pessoa adicionada à equipe", `${TEAM_ROLE_META[role]?.label ?? role}`);
}

export async function removeTeamMember(memberId: string, videoId: string) {
  const supabase = await getSupabase();
  await supabase.from(TABLES.videoTeam).delete().eq("id", memberId);
  await logActivity("VIDEO", videoId, "Pessoa removida da equipe");
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
  // Comentário só aparece dentro da própria aba — mesma lógica do
  // checklist, sem revalidateEverywhere.
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
  // currentVersion não aparece em nenhum card/coluna fora da aba — mesma
  // lógica do checklist e do comentário, sem revalidateEverywhere.
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
      color: String(formData.get("color") || "#7C3AED"),
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
  if (!name || !clientId) return undefined;

  const supabase = await getSupabase();
  const user = await getCurrentUser();
  const id = crypto.randomUUID();
  // Projeto não tem mais prazo próprio no produto — só video.finalDeadline
  // conta pra agendamento/atraso agora (ver isOverdue/computeDeliveryRisk).
  // As colunas deadline/original_deadline continuam NOT NULL no banco por
  // enquanto, então preenchemos com a data de criação como placeholder
  // técnico; nada na UI lê mais esses dois campos.
  const deadlineISO = nowISO();

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

// ---------------------------------------------------------------------------
// Convites — login próprio (e-mail/senha) pra quem não é admin da G2
// ---------------------------------------------------------------------------
// Só ADMIN convida gente nova — evita qualquer pessoa da equipe criar
// contas com papéis que não deveria poder atribuir.
export async function createInvite(formData: FormData) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") return undefined;

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "EDITOR");
  if (!name || !email) return undefined;

  const supabase = await getSupabase();
  const token = crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await supabase.from(TABLES.invites).insert(
    toRow({
      id: crypto.randomUUID(),
      token,
      email,
      name,
      role,
      invitedById: user.id,
      status: "PENDENTE",
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    })
  );

  revalidatePath("/equipe");
  return token;
}

export async function revokeInvite(inviteId: string) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") return;
  const supabase = await getSupabase();
  await supabase.from(TABLES.invites).update(toRow({ status: "REVOGADO" })).eq("id", inviteId);
  revalidatePath("/equipe");
}

// Chamada pela tela pública /convite/[token] logo depois que a pessoa
// convidada já tem uma sessão real (supabase.auth.signUp já rodou no
// browser) — nesse ponto ela já é "authenticated" pra RLS, então essa
// escrita não precisa de nenhuma função security-definer.
export async function markInviteAccepted(token: string) {
  const supabase = await getSupabase();
  await supabase.from(TABLES.invites).update(toRow({ status: "ACEITO", acceptedAt: nowISO() })).eq("token", token);
}
