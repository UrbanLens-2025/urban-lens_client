"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventOrderById } from "@/api/events";

export function useEventOrder(eventId: string | null, orderId: string | null) {
  return useQuery({
    queryKey: ['eventOrder', eventId, orderId],
    queryFn: () => getEventOrderById(eventId!, orderId!),
    enabled: !!eventId && !!orderId,
  });
}

