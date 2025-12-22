"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventTicketOrders } from "@/api/admin";

export function useEventTicketOrders(
  eventId: string | null,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["eventTicketOrders", eventId, params],
    queryFn: () => getEventTicketOrders(eventId!, params),
    enabled: !!eventId,
  });
}

