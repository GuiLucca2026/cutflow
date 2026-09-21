import Link from "next/link";
import { Sidebar } from "@/components/cutflow/sidebar";
import { Topbar } from "@/components/cutflow/topbar";
import { getCurrentUser, getAllUsers, getAuthUser } from "@/lib/auth";
import { listClients, listProjects, listVideos, listWorkloadEntries, listNotifications } from "@/db/queries";
import { computeAlerts } from "@/lib/alerts";
import { computePersonalMonthProgress } from "@/lib/domain";
import { VideoDetailProvider } from "@/components/cutflow/video-detail-context";
import { VideoDetailSheetHost } from "@/components/cutflow/video-detail-sheet";
import { addDays, format } from "date-fns";
import { BrandWordmark } from "@/components/cutflow/brand-mark";
import { BRAND_NAME, HAS_ADMIN_SSO } from "@/lib/brand";

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

  // listNotifications e listWorkloadEntries dependem do currentUser, então
  // ele é resolvido primeiro; o resto vai tudo junto num Promise.all só.
  // Antes, essas duas eram awaitadas UMA DEPOIS DA OUTRA depois do
  // Promise.all, somando dois tempos de ida e volta em série a cada
  // renderização do layout — e o layout re-renderiza a cada action que
  // revalida.
  const currentUser = await getCurrentUser();
  const [users, clients, projects, videos, notifications, workloadEntries] = await Promise.all([
    getAllUsers(),
    listClients(),
    listProjects(),
    listVideos(),
    listNotifications(currentUser.id),
    listWorkloadEntries(format(new Date(), "yyyy-MM-dd"), format(addDays(new Date(), 30), "yyyy-MM-dd")),
  ]);
  // notifications: Fase 12 (menção @, tarefa atribuída) — alimenta a aba
  // "Atividade" do sino. workloadEntries: mesma janela da capacidade em
  // Equipe, runway suficiente pros alertas de sobrecarga.
  const alerts = computeAlerts({ videos, workloadEntries, users });
  // Rodapé da Sidebar/menu mobile (Fase 15) — ver computePersonalMonthProgress
  // em lib/domain.ts pro porquê do escopo ser "mês corrente".
  const progress = computePersonalMonthProgress(videos, currentUser.id, format(new Date(), "yyyy-MM"));

  const usersLite = users.map((u) => ({ id: u.id, name: u.name, avatarColor: u.avatarColor }));
  // Cliente já resolvido aqui (não só clientId) pra "mover para projeto" no
  // menu de botão direito e na ficha do vídeo mostrarem "Projeto — Cliente"
  // sem precisar cruzar listas de novo em cada componente cliente.
  const projectsLite = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: clients.find((c) => c.id === p.clientId)?.name ?? null,
  }));

  return (
    <VideoDetailProvider users={usersLite} projects={projectsLite}>
      <div className="flex min-h-screen w-full">
        <Sidebar progress={progress} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            currentUser={currentUser}
            users={users}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId }))}
            linkedAccount={!!currentUser.supabaseUserId}
            alerts={alerts}
            notifications={notifications}
            progress={progress}
          />
          <main className="cf-page-shell flex-1 py-5 lg:py-7">{children}</main>
        </div>
        <VideoDetailSheetHost users={usersLite} projects={projectsLite} />
      </div>
    </VideoDetailProvider>
  );
}

async function hasSupabaseSession() {
  try {
    // getAuthUser() é memoizado por requisição (ver lib/auth.ts), então
    // este check e o getCurrentUser() logo abaixo dividem a MESMA ida ao
    // servidor de Auth em vez de fazer duas.
    return !!(await getAuthUser());
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
        <div className="flex justify-center mb-2">
          <BrandWordmark size="lg" />
        </div>
        {HAS_ADMIN_SSO ? (
          <p className="text-cf-text-dim text-sm">
            Este link não pode ser aberto diretamente. Se você é admin da G2,
            acesse o {BRAND_NAME} pelo botão{" "}
            <strong className="text-cf-text">“Abrir {BRAND_NAME}”</strong> no
            painel admin da G2 — ele já entra com o seu usuário automaticamente.
          </p>
        ) : (
          <p className="text-cf-text-dim text-sm">
            Sua sessão expirou ou este link não pode ser aberto diretamente.
          </p>
        )}
        <p className="text-cf-text-dim text-sm">
          Foi convidado por e-mail?{" "}
          <Link href="/login" className="text-cf-primary hover:underline">
            Entre com e-mail e senha aqui
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
