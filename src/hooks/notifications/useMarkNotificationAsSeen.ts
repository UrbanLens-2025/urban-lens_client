"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { markNotificationsAsSeen } from "@/api/notifications";
import { MarkNotificationsSeenPayload } from "@/types";

export function useMarkNotificationsAsSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkNotificationsSeenPayload) => {
      return markNotificationsAsSeen(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark notifications as seen");
    },
  });
}

// Convenience hook for marking a single notification as seen
export function useMarkNotificationAsSeen() {
  const markNotificationsAsSeen = useMarkNotificationsAsSeen();

  return {
    ...markNotificationsAsSeen,
    mutate: (notificationId: string, options?: Parameters<typeof markNotificationsAsSeen.mutate>[1]) => {
      markNotificationsAsSeen.mutate({ notificationId: [notificationId] }, options);
    },
    mutateAsync: (notificationId: string, options?: Parameters<typeof markNotificationsAsSeen.mutateAsync>[1]) => {
      return markNotificationsAsSeen.mutateAsync({ notificationId: [notificationId] }, options);
    },
  };
}

