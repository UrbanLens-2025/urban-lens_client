"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { suspendAccount, SuspendAccountPayload } from "@/api/admin";

export function useSuspendAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: string; payload: SuspendAccountPayload }) =>
      suspendAccount(accountId, payload),
    onSuccess: (_, variables) => {
      toast.success("Account suspended successfully");
      queryClient.invalidateQueries({ queryKey: ['admin', 'account', variables.accountId, 'suspensions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'account', variables.accountId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend account. Please try again.");
    },
  });
}
