"use client";

import { useQuery } from "@tanstack/react-query";
import { getOwnerEventById } from "@/api/events";

export function useOwnerEventById(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ['ownerEventDetail', eventId],
    queryFn: () => getOwnerEventById(eventId!),
    enabled: !!eventId,
  });
}
