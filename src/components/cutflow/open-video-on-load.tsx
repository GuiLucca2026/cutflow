"use client";

import * as React from "react";
import { useVideoDetail } from "@/components/cutflow/video-detail-context";

export function OpenVideoOnLoad({ videoId }: { videoId: string }) {
  const { open } = useVideoDetail();
  React.useEffect(() => {
    open(videoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);
  return null;
}
