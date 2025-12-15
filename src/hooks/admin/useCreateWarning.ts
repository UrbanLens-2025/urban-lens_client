"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createWarning, CreateWarningPayload } from "@/api/admin";

export function useCreateWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: string; payload: CreateWarningPayload }) =>
      createWarning(accountId, payload),
    onSuccess: (_, variables) => {
      toast.success("Warning created successfully");
      queryClient.invalidateQueries({ queryKey: ['admin', 'account', variables.accountId, 'warnings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'account', variables.accountId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create warning. Please try again.");
    },
  });
}

