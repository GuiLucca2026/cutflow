"use client";

import * as React from "react";

export type UserLite = { id: string; name: string; avatarColor: string };
// clientName já vem resolvido (não só clientId) pra exibir "Projeto —
// Cliente" no menu sem precisar cruzar com a lista de clientes de novo.
export type ProjectLite = { id: string; name: string; clientName: string | null };

type VideoDetailContextValue = {
  openVideoId: string | null;
  open: (id: string) => void;
  close: () => void;
  bump: number;
  refresh: () => void;
  // A equipe e a lista de projetos vivem aqui pra qualquer card poder
  // oferecer "definir responsável" / "mover para projeto" sem que essas
  // listas sejam repassadas de página em página até chegar no card (o
  // layout já carrega isso uma vez por request de qualquer jeito).
  users: UserLite[];
  projects: ProjectLite[];
};

const VideoDetailContext = React.createContext<VideoDetailContextValue | null>(null);

export function VideoDetailProvider({
  children,
  users = [],
  projects = [],
}: {
  children: React.ReactNode;
  users?: UserLite[];
  projects?: ProjectLite[];
}) {
  const [openVideoId, setOpenVideoId] = React.useState<string | null>(null);
  const [bump, setBump] = React.useState(0);

  const value = React.useMemo(
    () => ({
      openVideoId,
      open: (id: string) => setOpenVideoId(id),
      close: () => setOpenVideoId(null),
      bump,
      refresh: () => setBump((b) => b + 1),
      users,
      projects,
    }),
    [openVideoId, bump, users, projects]
  );

  return <VideoDetailContext.Provider value={value}>{children}</VideoDetailContext.Provider>;
}

export function useVideoDetail() {
  const ctx = React.useContext(VideoDetailContext);
  if (!ctx) throw new Error("useVideoDetail must be used within VideoDetailProvider");
  return ctx;
}
