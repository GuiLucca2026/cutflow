"use client";

import * as React from "react";

export type UserLite = { id: string; name: string; avatarColor: string };

type VideoDetailContextValue = {
  openVideoId: string | null;
  open: (id: string) => void;
  close: () => void;
  bump: number;
  refresh: () => void;
  // A equipe vive aqui pra qualquer card poder oferecer "definir
  // responsável" sem que a lista de pessoas seja repassada de página em
  // página até chegar no card (o layout já carrega isso uma vez por
  // request de qualquer jeito).
  users: UserLite[];
};

const VideoDetailContext = React.createContext<VideoDetailContextValue | null>(null);

export function VideoDetailProvider({ children, users = [] }: { children: React.ReactNode; users?: UserLite[] }) {
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
    }),
    [openVideoId, bump, users]
  );

  return <VideoDetailContext.Provider value={value}>{children}</VideoDetailContext.Provider>;
}

export function useVideoDetail() {
  const ctx = React.useContext(VideoDetailContext);
  if (!ctx) throw new Error("useVideoDetail must be used within VideoDetailProvider");
  return ctx;
}
