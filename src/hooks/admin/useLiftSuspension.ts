"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { liftSuspension } from "@/api/admin";

export function useLiftSuspension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, suspensionId }: { accountId: string; suspensionId: string }) =>
      liftSuspension(accountId, suspensionId),
    onSuccess: (_, variables) => {
      toast.success("Suspension lifted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin', 'account', variables.accountId, 'suspensions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'account', variables.accountId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to lift suspension. Please try again.");
    },
  });
}

