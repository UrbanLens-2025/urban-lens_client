"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventRequestById } from "@/api/events";

export function useEventRequestById(requestId: string | null) {
  return useQuery({
    queryKey: ['eventRequestDetail', requestId],
    queryFn: () => getEventRequestById(requestId!),
    enabled: !!requestId,
  });
}