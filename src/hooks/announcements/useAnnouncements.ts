"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "@/api/announcements";
import type { GetAnnouncementsParams } from "@/types";

export function useAnnouncements(params: GetAnnouncementsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["announcements", params],
    queryFn: () => {
      if (!params.locationId) {
        throw new Error("locationId is required to fetch announcements");
      }
      return getAnnouncements(params);
    },
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled ?? Boolean(params.locationId),
  });
}
