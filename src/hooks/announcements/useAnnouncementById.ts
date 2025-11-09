"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnnouncementById } from "@/api/announcements";

export function useAnnouncementById(announcementId: string | undefined) {
  return useQuery({
    queryKey: ["announcement", announcementId],
    queryFn: () => {
      if (!announcementId) {
        throw new Error("announcementId is required");
      }
      return getAnnouncementById(announcementId);
    },
    enabled: Boolean(announcementId),
  });
}
