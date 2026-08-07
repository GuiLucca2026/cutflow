import { NextRequest, NextResponse } from "next/server";
import { getVideo, getVideoActivity } from "@/db/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [video, activity] = await Promise.all([getVideo(id), getVideoActivity(id)]);
  if (!video) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ video, activity });
}
