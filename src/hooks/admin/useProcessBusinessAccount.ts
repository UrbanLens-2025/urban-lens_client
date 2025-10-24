"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processBusinessAccount } from "@/api/admin";
import { ProcessRequestPayload } from "@/types";

export function useProcessBusinessAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string, payload: ProcessRequestPayload }) => 
      processBusinessAccount(variables),
    
    onSuccess: (_, variables) => {
      toast.success(`Business account has been ${variables.payload.status.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['businessAccounts'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to process account.");
    },
  });
}