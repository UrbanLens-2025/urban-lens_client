"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteCreatorAnnouncement, getCreatorAnnouncementById } from "@/api/announcements";

export function useDeleteCreatorAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      await deleteCreatorAnnouncement(announcementId);
      return announcementId;
    },
    onSuccess: (announcementId) => {
      toast.success("Announcement deleted");
      const cached = queryClient.getQueryData([
        "creatorAnnouncement",
        announcementId,
      ]) as Awaited<ReturnType<typeof getCreatorAnnouncementById>> | undefined;
      if (cached?.eventId) {
        queryClient.invalidateQueries({ queryKey: ["creatorAnnouncements", { eventId: cached.eventId }] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["creatorAnnouncements"] });
      }
      queryClient.removeQueries({ queryKey: ["creatorAnnouncement", announcementId], exact: true });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to delete announcement";
      toast.error(message);
    },
  });
}
