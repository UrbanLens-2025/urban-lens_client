"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationBookingsForEvent } from "@/api/events";

export function useEventLocationBookings(eventId: string) {
  return useQuery({
    queryKey: ['eventLocationBookings', eventId],
    queryFn: () => getLocationBookingsForEvent(eventId),
    enabled: !!eventId,
  });
}

