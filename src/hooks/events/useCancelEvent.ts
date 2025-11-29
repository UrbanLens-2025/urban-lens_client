"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelEvent, CancelEventPayload } from "@/api/events";

export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: CancelEventPayload;
    }) => cancelEvent(eventId, payload),
    
    onSuccess: (data, variables) => {
      toast.success("Event has been cancelled successfully.");
      // Invalidate event queries
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventDetail', variables.eventId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel event.");
    },
  });
}

