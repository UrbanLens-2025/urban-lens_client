"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventTickets } from "@/api/events";

export function useEventTickets(eventId: string | null) {
  return useQuery({
    queryKey: ['eventTickets', eventId],
    queryFn: () => getEventTickets(eventId!),
    enabled: !!eventId,
  });
}

