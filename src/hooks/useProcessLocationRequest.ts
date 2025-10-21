"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processLocationRequest, ProcessRequestPayload } from "@/api/admin";

export function useProcessLocationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string, payload: ProcessRequestPayload }) => 
      processLocationRequest(variables),

    onSuccess: (_, variables) => {
      toast.success(`Request has been ${variables.payload.status.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['pendingLocationRequests'] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to process request.");
    },
  });
}