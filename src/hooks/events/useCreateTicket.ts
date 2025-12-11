"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTicket } from "@/api/events";
import type { CreateTicketPayload } from "@/types";

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: CreateTicketPayload }) =>
      createTicket(eventId, payload),
    onSuccess: (data, variables) => {
      toast.success("Ticket created successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventDetail', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      router.push(`/dashboard/creator/events/${variables.eventId}/tickets`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create ticket. Please try again.");
    },
  });
}

