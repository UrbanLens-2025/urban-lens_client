"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminTicketOrderByIdForTransaction } from "@/api/admin";

export function useAdminTicketOrderById(ticketOrderId: string | null) {
  return useQuery({
    queryKey: ["adminTicketOrderForTransaction", ticketOrderId],
    queryFn: () => getAdminTicketOrderByIdForTransaction(ticketOrderId!),
    enabled: !!ticketOrderId,
  });
}
