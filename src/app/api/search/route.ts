import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/db";
import { TABLES } from "@/db/schema";
import { mapClient, mapProject, mapVideo } from "@/db/mappers";

// Global search (spec section 29): clients, projects, videos in one query.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ clients: [], projects: [], videos: [] });
  }
  const supabase = await getSupabase();
  const like = `%${q}%`;

  const [clientRes, projectRes, videoRes] = await Promise.all([
    supabase
      .from(TABLES.clients)
      .select("*")
      .or(`name.ilike.${like},trade_name.ilike.${like},company.ilike.${like}`)
      .limit(5),
    supabase.from(TABLES.projects).select("*, client:cutflow_clients(*)").ilike("name", like).limit(5),
    supabase
      .from(TABLES.videos)
      .select("*, project:cutflow_projects(*, client:cutflow_clients(*))")
      .ilike("name", like)
      .limit(8),
  ]);
  if (clientRes.error) throw clientRes.error;
  if (projectRes.error) throw projectRes.error;
  if (videoRes.error) throw videoRes.error;

  const clientRows = clientRes.data.map((r) => mapClient(r)!);
  const projectRows = projectRes.data.map((r) => mapProject(r)!);
  const videoRows = videoRes.data.map((r) => mapVideo(r)!);

  return NextResponse.json({
    clients: clientRows.map((c) => ({ id: c!.id, name: c!.name, tradeName: c!.tradeName })),
    projects: projectRows.map((p: any) => ({ id: p.id, name: p.name, clientName: p.client?.name })),
    videos: videoRows.map((v: any) => ({
      id: v.id,
      name: v.name,
      projectId: v.projectId,
      projectName: v.project?.name,
      clientName: v.project?.client?.name,
      status: v.status,
    })),
  });
}
