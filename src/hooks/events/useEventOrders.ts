"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventOrders } from "@/api/events";
import type { GetEventOrdersParams } from "@/types";

export function useEventOrders(
  eventId: string | null,
  params?: GetEventOrdersParams
) {
  return useQuery({
    queryKey: ['eventOrders', eventId, params],
    queryFn: () => getEventOrders(eventId!, params),
    enabled: !!eventId,
  });
}

