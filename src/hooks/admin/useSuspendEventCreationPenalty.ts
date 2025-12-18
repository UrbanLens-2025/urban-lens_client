"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { suspendEventCreationPenalty } from "@/api/penalty";

type SuspendEventCreationPenaltyPayload = {
  targetEntityId: string;
  suspendUntil: string;
  suspensionReason: string;
};

export function useSuspendEventCreationPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetEntityId,
      suspendUntil,
      suspensionReason,
    }: SuspendEventCreationPenaltyPayload) =>
      suspendEventCreationPenalty({
        targetEntityId,
        targetEntityType: "event",
        suspendUntil,
        suspensionReason,
      }),
    onSuccess: () => {
      toast.success("Event creation suspended successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend event creation");
    },
  });
}


