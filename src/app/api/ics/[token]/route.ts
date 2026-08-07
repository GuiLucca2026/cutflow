import { createClient } from "@supabase/supabase-js";
import { buildIcsFeed, type IcsFeedRow } from "@/lib/ics";

// Public endpoint — deliberately NOT behind auth. Calendar apps (Google,
// Apple, Outlook) poll this URL on their own schedule with no session/
// cookies at all, so it can't depend on the normal authenticated Supabase
// client. Instead it calls a SECURITY DEFINER SQL function that only
// returns rows for the editor whose token matches (see supabase-setup.sql,
// "Fase 4 — Calendar Sync"). RLS on the underlying tables is untouched —
// this is the one narrow, token-gated exception.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !token) {
    return new Response("Não configurado.", { status: 500 });
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc("cutflow_ics_feed", { p_token: token });
  if (error) {
    return new Response(`Erro ao gerar a agenda: ${error.message}`, { status: 500 });
  }

  const rows = (data ?? []) as IcsFeedRow[];
  const calendarName = rows[0]?.editor_name ? `G2 FLOW — ${rows[0].editor_name}` : "G2 FLOW — Minha Agenda";
  const ics = buildIcsFeed(calendarName, rows);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="g2flow.ics"',
      // Calendar clients poll on their own cadence (Google ~ every few
      // hours) regardless of this header, so a short cache just avoids
      // regenerating the feed on rapid repeat hits.
      "Cache-Control": "public, max-age=900",
    },
  });
}
