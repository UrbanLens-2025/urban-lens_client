"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createEventRequest } from "@/api/events";
import { CreateEventRequestPayload } from "@/types";
import { useRouter } from "next/navigation";

export function useCreateEventRequest() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateEventRequestPayload) => createEventRequest(payload),
    
    onSuccess: () => {
      toast.success("Event request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
      router.push('/dashboard/creator/request');
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create event request.");
    },
  });
}