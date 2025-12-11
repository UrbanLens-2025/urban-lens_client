"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTicket } from "@/api/events";
import type { UpdateTicketPayload } from "@/types";

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ eventId, ticketId, payload }: { eventId: string; ticketId: string; payload: UpdateTicketPayload }) =>
      updateTicket(eventId, ticketId, payload),
    onSuccess: (data, variables) => {
      toast.success("Ticket updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventTickets', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', variables.eventId, variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['eventDetail', variables.eventId] });
      router.push(`/dashboard/creator/events/${variables.eventId}/tickets`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update ticket. Please try again.");
    },
  });
}

