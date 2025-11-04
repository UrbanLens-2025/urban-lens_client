"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventById } from "@/api/events";

export function useEventById(eventId: string | null) {
  return useQuery({
    queryKey: ['eventDetail', eventId],
    queryFn: () => getEventById(eventId!),
    enabled: !!eventId,
  });
}

