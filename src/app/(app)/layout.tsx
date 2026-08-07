import { Sidebar } from "@/components/cutflow/sidebar";
import { Topbar } from "@/components/cutflow/topbar";
import { getCurrentUser, getAllUsers } from "@/lib/auth";
import { listClients, listProjects } from "@/db/queries";
import { VideoDetailProvider } from "@/components/cutflow/video-detail-context";
import { VideoDetailSheetHost } from "@/components/cutflow/video-detail-sheet";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSupabaseSession())) {
    // No real Supabase Auth session (e.g. this URL was opened directly,
    // not via the "Abrir CUTFLOW" button in the G2 admin panel). RLS
    // blocks every read/write for unauthenticated (anon) requests by
    // design (see supabase-setup.sql) — everything below this point would
    // come back empty/null, so we stop here with a clear message instead
    // of crashing on a null currentUser.
    return <NoSessionScreen />;
  }

  const [currentUser, users, clients, projects] = await Promise.all([
    getCurrentUser(),
    getAllUsers(),
    listClients(),
    listProjects(),
  ]);

  return (
    <VideoDetailProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            currentUser={currentUser}
            users={users}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId }))}
            linkedAccount={!!currentUser.supabaseUserId}
          />
          <main className="flex-1 p-5 lg:p-7 max-w-[1600px] w-full mx-auto">{children}</main>
        </div>
        <VideoDetailSheetHost users={users.map((u) => ({ id: u.id, name: u.name, avatarColor: u.avatarColor }))} />
      </div>
    </VideoDetailProvider>
  );
}

async function hasSupabaseSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    // NEXT_PUBLIC_SUPABASE_URL/KEY not set, or the check itself failed —
    // treat as "no session" rather than crashing the page.
    return false;
  }
}

function NoSessionScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cf-black text-cf-text px-6">
      <div className="max-w-sm text-center space-y-3">
        <h1 className="font-display text-3xl tracking-wide">CUTFLOW</h1>
        <p className="text-cf-text-dim text-sm">
          Este link não pode ser aberto diretamente. Acesse o CUTFLOW pelo
          botão <strong className="text-cf-text">“Abrir CUTFLOW”</strong> no
          painel admin da G2 — ele já entra com o seu usuário automaticamente.
        </p>
      </div>
    </div>
  );
}
