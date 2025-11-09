"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCreatorAnnouncement } from "@/api/announcements";
import type { CreateCreatorAnnouncementPayload } from "@/types";

export function useCreateCreatorAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCreatorAnnouncementPayload) => createCreatorAnnouncement(payload),
    onSuccess: (_, variables) => {
      toast.success("Announcement created successfully");
      queryClient.invalidateQueries({
        queryKey: ["creatorAnnouncements", { eventId: variables.eventId }],
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to create announcement";
      toast.error(message);
    },
  });
}
