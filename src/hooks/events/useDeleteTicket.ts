"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteTicket } from "@/api/events";

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, ticketId }: { eventId: string; ticketId: string }) =>
      deleteTicket(eventId, ticketId),
    onSuccess: (_, variables) => {
      toast.success("Ticket deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventTickets', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['eventDetail', variables.eventId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to delete ticket. Please try again.";
      toast.error(message);
    },
  });
}

