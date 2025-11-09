"use client";

import { useQuery } from "@tanstack/react-query";
import { getCreatorAnnouncements } from "@/api/announcements";
import type { GetCreatorAnnouncementsParams } from "@/types";

export function useCreatorAnnouncements(
  params: GetCreatorAnnouncementsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["creatorAnnouncements", params],
    queryFn: () => {
      if (!params.eventId) {
        throw new Error("eventId is required to fetch announcements");
      }
      return getCreatorAnnouncements(params);
    },
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled ?? Boolean(params.eventId),
  });
}
