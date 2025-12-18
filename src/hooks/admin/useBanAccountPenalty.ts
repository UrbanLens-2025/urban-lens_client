"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { banAccountPenalty } from "@/api/penalty";

type BanAccountPenaltyPayload = {
  targetEntityId: string;
  suspensionReason: string;
};

export function useBanAccountPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetEntityId, suspensionReason }: BanAccountPenaltyPayload) =>
      banAccountPenalty({
        targetEntityId,
        targetEntityType: "post",
        suspensionReason,
      }),
    onSuccess: () => {
      toast.success("Account banned successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to ban account");
    },
  });
}


