"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAnnouncement, getAnnouncementById } from "@/api/announcements";

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      await deleteAnnouncement(announcementId);
      return announcementId;
    },
    onSuccess: async (announcementId) => {
      toast.success("Announcement deleted");
      const cached = queryClient.getQueryData(["announcement", announcementId]) as
        | Awaited<ReturnType<typeof getAnnouncementById>>
        | undefined;
      if (cached?.locationId) {
        queryClient.invalidateQueries({ queryKey: ["announcements", { locationId: cached.locationId }] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      }
      queryClient.removeQueries({ queryKey: ["announcement", announcementId], exact: true });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to delete announcement";
      toast.error(message);
    },
  });
}
