"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateCreatorAnnouncement } from "@/api/announcements";
import type { UpdateCreatorAnnouncementPayload } from "@/types";

export function useUpdateCreatorAnnouncement(announcementId: string, eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCreatorAnnouncementPayload) =>
      updateCreatorAnnouncement(announcementId, payload),
    onSuccess: () => {
      toast.success("Announcement updated");
      queryClient.invalidateQueries({ queryKey: ["creatorAnnouncements", { eventId }] });
      queryClient.invalidateQueries({ queryKey: ["creatorAnnouncement", announcementId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to update announcement";
      toast.error(message);
    },
  });
}
