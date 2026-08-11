import { getSupabase } from "@/db";
import { TABLES } from "@/db/schema";
import {
  mapClient,
  mapUser,
  mapProject,
  mapVideo,
  mapActivityLog,
  mapWorkloadEntry,
  mapCapture,
  mapInvite,
} from "@/db/mappers";

export async function listClients() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(TABLES.clients).select("*").order("name");
  if (error) throw error;
  return data.map((r) => mapClient(r)!);
}

export async function getClient(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(TABLES.clients).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return mapClient(data);
}

export async function listUsers() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(TABLES.users).select("*").order("name");
  if (error) throw error;
  return data.map((r) => mapUser(r)!);
}

export async function getUser(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(TABLES.users).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return mapUser(data);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
// cutflow_projects has TWO foreign keys into cutflow_users (producer_id,
// lead_editor_id), and cutflow_videos has two more (editor_id,
// approver_id) — PostgREST needs a hint (`!column_name`) to know which FK
// to embed on, since it can't infer it from the alias alone.
const PROJECT_SELECT =
  "*, client:cutflow_clients(*), producer:cutflow_users!producer_id(*), leadEditor:cutflow_users!lead_editor_id(*), videos:cutflow_videos(*, editor:cutflow_users!editor_id(*))";

// Vídeo embutido dentro de projeto (project.videos) não passa pelo filtro
// da query principal — PostgREST não filtra recurso aninhado por coluna
// dele mesmo via .select() simples, então tiramos os excluídos aqui, do
// lado do JS, depois de mapear. Mantém "excluído some de todo lugar,
// exceto a Lixeira" verdadeiro mesmo pra listas aninhadas.
function stripDeletedVideos(project: any): any {
  if (project?.videos) project.videos = project.videos.filter((v: any) => !v.deletedAt);
  return project;
}

export async function listProjects() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(TABLES.projects)
    .select(PROJECT_SELECT)
    .is("deleted_at", null)
    .order("deadline", { ascending: false });
  if (error) throw error;
  return data.map((r) => stripDeletedVideos(mapProject(r)!));
}

export async function getProject(id: string) {
  const supabase = await getSupabase();
  const select =
    "*, client:cutflow_clients(*), producer:cutflow_users!producer_id(*), leadEditor:cutflow_users!lead_editor_id(*), links:cutflow_project_links(*), videos:cutflow_videos(*, editor:cutflow_users!editor_id(*))";
  const { data, error } = await supabase.from(TABLES.projects).select(select).eq("id", id).maybeSingle();
  if (error) throw error;
  const mapped = mapProject(data);
  return mapped ? stripDeletedVideos(mapped) : null;
}

export async function listProjectsByClient(clientId: string) {
  const supabase = await getSupabase();
  const select = "*, videos:cutflow_videos(*)";
  const { data, error } = await supabase
    .from(TABLES.projects)
    .select(select)
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("deadline", { ascending: false });
  if (error) throw error;
  return data.map((r) => stripDeletedVideos(mapProject(r)!));
}

// Lixeira — só o que foi excluído (deleted_at preenchido), mais recente
// primeiro. Usado pela página /lixeira; nenhuma outra tela chama isso.
export async function listDeletedProjects() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(TABLES.projects)
    .select(PROJECT_SELECT)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => mapProject(r)!);
}

export async function getProjectActivity(projectId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(TABLES.activityLogs)
    .select("*")
    .eq("entity_type", "PROJECT")
    .eq("entity_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => mapActivityLog(r)!);
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
const VIDEO_SELECT =
  "*, project:cutflow_projects(*, client:cutflow_clients(*)), editor:cutflow_users!editor_id(*), approver:cutflow_users!approver_id(*)";

export async function listVideos() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(TABLES.videos).select(VIDEO_SELECT).is("deleted_at", null).order("final_deadline");
  if (error) throw error;
  return data.map((r) => mapVideo(r)!);
}

// Lixeira — só vídeos excluídos, mais recente primeiro.
export async function listDeletedVideos() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(TABLES.videos)
    .select(VIDEO_SELECT)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => mapVideo(r)!);
}

export async function getVideo(id: string) {
  const supabase = await getSupabase();
  const select =
    "*, project:cutflow_projects(*, client:cutflow_clients(*)), editor:cutflow_users!editor_id(*), approver:cutflow_users!approver_id(*), " +
    "checklist:cutflow_checklist_items(*, completedBy:cutflow_users!completed_by_id(*)), versions:cutflow_video_versions(*), " +
    "revisions:cutflow_revisions(*, assignedTo:cutflow_users!assigned_to_id(*), requestedBy:cutflow_users!requested_by_id(*)), " +
    "comments:cutflow_comments(*, author:cutflow_users!author_id(*))";
  const { data, error } = await supabase.from(TABLES.videos).select(select).eq("id", id).maybeSingle();
  if (error) throw error;
  const video = mapVideo(data);
  if (!video) return video;
  // Nested/embedded resources come back unordered from PostgREST — sort
  // client-side rather than depend on the foreignTable ordering option.
  video.checklist?.sort((a: any, b: any) => a.order - b.order);
  video.versions?.sort((a: any, b: any) => (a.sentAt < b.sentAt ? 1 : -1));
  video.revisions?.sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1));
  video.comments?.sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1));
  return video;
}

export async function getVideoActivity(videoId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(TABLES.activityLogs)
    .select("*, user:cutflow_users!user_id(*)")
    .eq("entity_type", "VIDEO")
    .eq("entity_id", videoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => mapActivityLog(r)!);
}

// ---------------------------------------------------------------------------
// Workload
// ---------------------------------------------------------------------------
export async function listWorkloadEntries(fromISO: string, toISO: string) {
  const supabase = await getSupabase();
  const select =
    "*, editor:cutflow_users!editor_id(*), video:cutflow_videos(*, project:cutflow_projects(*, client:cutflow_clients(*)))";
  const { data, error } = await supabase
    .from(TABLES.workloadEntries)
    .select(select)
    .gte("date", fromISO)
    .lte("date", toISO);
  if (error) throw error;
  return data.map((r) => mapWorkloadEntry(r)!);
}

// ---------------------------------------------------------------------------
// Captures (Fase 4 — shoot/capture sessions, separate from video editing)
// ---------------------------------------------------------------------------
export async function listCaptures() {
  const supabase = await getSupabase();
  const select = "*, project:cutflow_projects(*, client:cutflow_clients(*))";
  const { data, error } = await supabase.from(TABLES.captures).select(select).order("date");
  if (error) throw error;
  return data.map((r) => mapCapture(r)!);
}

// ---------------------------------------------------------------------------
// Invites (real email/senha login pra quem não é admin da G2)
// ---------------------------------------------------------------------------
export async function listInvites() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(TABLES.invites)
    .select("*, invitedBy:cutflow_users!invited_by_id(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => mapInvite(r)!);
}

export type VideoWithRelations = Awaited<ReturnType<typeof listVideos>>[number];
export type ProjectWithRelations = Awaited<ReturnType<typeof listProjects>>[number];
