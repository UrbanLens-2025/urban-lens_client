"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAnnouncement } from "@/api/announcements";
import type { CreateAnnouncementPayload } from "@/types";

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => createAnnouncement(payload),
    onSuccess: (_, variables) => {
      toast.success("Announcement created successfully");
      queryClient.invalidateQueries({ queryKey: ["announcements", { locationId: variables.locationId }] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to create announcement";
      toast.error(message);
    },
  });
}
