"use client";

import * as React from "react";

type VideoDetailContextValue = {
  openVideoId: string | null;
  open: (id: string) => void;
  close: () => void;
  bump: number;
  refresh: () => void;
};

const VideoDetailContext = React.createContext<VideoDetailContextValue | null>(null);

export function VideoDetailProvider({ children }: { children: React.ReactNode }) {
  const [openVideoId, setOpenVideoId] = React.useState<string | null>(null);
  const [bump, setBump] = React.useState(0);

  const value = React.useMemo(
    () => ({
      openVideoId,
      open: (id: string) => setOpenVideoId(id),
      close: () => setOpenVideoId(null),
      bump,
      refresh: () => setBump((b) => b + 1),
    }),
    [openVideoId, bump]
  );

  return <VideoDetailContext.Provider value={value}>{children}</VideoDetailContext.Provider>;
}

export function useVideoDetail() {
  const ctx = React.useContext(VideoDetailContext);
  if (!ctx) throw new Error("useVideoDetail must be used within VideoDetailProvider");
  return ctx;
}
