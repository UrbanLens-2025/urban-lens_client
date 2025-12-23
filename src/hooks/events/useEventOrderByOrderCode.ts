"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventOrderByOrderCode } from "@/api/events";

export function useEventOrderByOrderCode(eventId: string | null, orderCode: string | null) {
  return useQuery({
    queryKey: ['eventOrderByOrderCode', eventId, orderCode],
    queryFn: () => getEventOrderByOrderCode(eventId!, orderCode!),
    enabled: !!eventId && !!orderCode,
  });
}

