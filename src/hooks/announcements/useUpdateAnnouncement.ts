"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateAnnouncement } from "@/api/announcements";
import type { UpdateAnnouncementPayload } from "@/types";

export function useUpdateAnnouncement(announcementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAnnouncementPayload) => updateAnnouncement(announcementId, payload),
    onSuccess: (announcement) => {
      toast.success("Announcement updated");
      queryClient.invalidateQueries({ queryKey: ["announcements", { locationId: announcement.locationId }] });
      queryClient.invalidateQueries({ queryKey: ["announcement", announcement.id] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to update announcement";
      toast.error(message);
    },
  });
}
