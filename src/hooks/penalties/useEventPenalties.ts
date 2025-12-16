"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventPenalties } from "@/api/penalties";

export function useEventPenalties(eventId: string | null) {
  return useQuery({
    queryKey: ['eventPenalties', eventId],
    queryFn: () => getEventPenalties(eventId!),
    enabled: !!eventId,
  });
}

