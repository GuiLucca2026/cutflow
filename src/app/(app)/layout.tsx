import { Sidebar } from "@/components/cutflow/sidebar";
import { Topbar } from "@/components/cutflow/topbar";
import { getCurrentUser, getAllUsers } from "@/lib/auth";
import { listClients, listProjects } from "@/db/queries";
import { VideoDetailProvider } from "@/components/cutflow/video-detail-context";
import { VideoDetailSheetHost } from "@/components/cutflow/video-detail-sheet";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
