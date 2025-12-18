"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { forceCancelEventPenalty } from "@/api/penalty";

type ForceCancelEventPenaltyPayload = {
  targetEntityId: string;
  reason: string;
};

export function useForceCancelEventPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetEntityId, reason }: ForceCancelEventPenaltyPayload) =>
      forceCancelEventPenalty({
        targetEntityId,
        targetEntityType: "event",
        reason,
      }),
    onSuccess: () => {
      toast.success("Event cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel event");
    },
  });
}


