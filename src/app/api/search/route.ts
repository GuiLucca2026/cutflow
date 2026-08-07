import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, projects, videos } from "@/db/schema";
import { ilike, or } from "drizzle-orm";

// Global search (spec section 29): clients, projects, videos in one query.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ clients: [], projects: [], videos: [] });
  }
  const like_ = `%${q}%`;

  const [clientRows, projectRows, videoRows] = await Promise.all([
    db.query.clients.findMany({
      where: or(ilike(clients.name, like_), ilike(clients.tradeName, like_), ilike(clients.company, like_)),
      limit: 5,
    }),
    db.query.projects.findMany({
      where: ilike(projects.name, like_),
      with: { client: true },
      limit: 5,
    }),
    db.query.videos.findMany({
      where: ilike(videos.name, like_),
      with: { project: { with: { client: true } } },
      limit: 8,
    }),
  ]);

  return NextResponse.json({
    clients: clientRows.map((c) => ({ id: c.id, name: c.name, tradeName: c.tradeName })),
    projects: projectRows.map((p) => ({ id: p.id, name: p.name, clientName: p.client?.name })),
    videos: videoRows.map((v) => ({
      id: v.id,
      name: v.name,
      projectId: v.projectId,
      projectName: v.project?.name,
      clientName: v.project?.client?.name,
      status: v.status,
    })),
  });
}
