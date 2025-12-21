"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelLocationRequest } from "@/api/locations";

export function useCancelLocationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => cancelLocationRequest(requestId),
    
    onSuccess: (_, requestId) => {
      toast.success("Request has been cancelled.");
      queryClient.invalidateQueries({ queryKey: ['locationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['locationRequest', requestId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel request.");
    },
  });
}