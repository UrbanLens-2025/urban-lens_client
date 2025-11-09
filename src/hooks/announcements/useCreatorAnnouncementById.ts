"use client";

import { useQuery } from "@tanstack/react-query";
import { getCreatorAnnouncementById } from "@/api/announcements";

export function useCreatorAnnouncementById(announcementId: string | undefined) {
  return useQuery({
    queryKey: ["creatorAnnouncement", announcementId],
    queryFn: () => {
      if (!announcementId) {
        throw new Error("announcementId is required");
      }
      return getCreatorAnnouncementById(announcementId);
    },
    enabled: Boolean(announcementId),
  });
}
