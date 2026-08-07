import { db } from "@/db";
import {
  clients,
  projects,
  videos,
  users,
  checklistItems,
  videoVersions,
  revisions,
  comments,
  activityLogs,
  projectLinks,
  workloadEntries,
} from "@/db/schema";
import { and, desc, eq, gte, lte, asc, sql } from "drizzle-orm";

export async function listClients() {
  return db.query.clients.findMany({ orderBy: asc(clients.name) });
}

export async function getClient(id: string) {
  return db.query.clients.findFirst({ where: eq(clients.id, id) });
}

export async function listUsers() {
  return db.query.users.findMany({ orderBy: asc(users.name) });
}

export async function getUser(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function listProjects() {
  const rows = await db.query.projects.findMany({
    with: { client: true, producer: true, leadEditor: true, videos: { with: { editor: true } } },
    orderBy: desc(projects.deadline),
  });
  return rows;
}

export async function getProject(id: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      client: true,
      producer: true,
      leadEditor: true,
      links: true,
      videos: { with: { editor: true } },
    },
  });
}

export async function getProjectActivity(projectId: string) {
  return db.query.activityLogs.findMany({
    where: and(eq(activityLogs.entityType, "PROJECT"), eq(activityLogs.entityId, projectId)),
    orderBy: desc(activityLogs.createdAt),
  });
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
export async function listVideos() {
  return db.query.videos.findMany({
    with: { project: { with: { client: true } }, editor: true, approver: true },
    orderBy: asc(videos.finalDeadline),
  });
}

export async function getVideo(id: string) {
  return db.query.videos.findFirst({
    where: eq(videos.id, id),
    with: {
      project: { with: { client: true } },
      editor: true,
      approver: true,
      checklist: { orderBy: asc(checklistItems.order) },
      versions: { orderBy: desc(videoVersions.sentAt) },
      revisions: { orderBy: desc(revisions.createdAt), with: { assignedTo: true, requestedBy: true } },
      comments: { orderBy: desc(comments.createdAt), with: { author: true } },
    },
  });
}

export async function getVideoActivity(videoId: string) {
  return db.query.activityLogs.findMany({
    where: and(eq(activityLogs.entityType, "VIDEO"), eq(activityLogs.entityId, videoId)),
    orderBy: desc(activityLogs.createdAt),
    with: { user: true },
  });
}

// ---------------------------------------------------------------------------
// Workload
// ---------------------------------------------------------------------------
export async function listWorkloadEntries(fromISO: string, toISO: string) {
  return db.query.workloadEntries.findMany({
    where: and(gte(workloadEntries.date, fromISO), lte(workloadEntries.date, toISO)),
    with: { editor: true, video: { with: { project: { with: { client: true } } } } },
  });
}

export type VideoWithRelations = Awaited<ReturnType<typeof listVideos>>[number];
export type ProjectWithRelations = Awaited<ReturnType<typeof listProjects>>[number];
