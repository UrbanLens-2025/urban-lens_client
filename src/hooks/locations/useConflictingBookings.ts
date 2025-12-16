"use client";

import { useQuery } from "@tanstack/react-query";
import { getConflictingBookings } from "@/api/locations";

export function useConflictingBookings(locationBookingId: string | null | undefined) {
  return useQuery({
    queryKey: ['conflictingBookings', locationBookingId],
    queryFn: () => getConflictingBookings(locationBookingId!),
    enabled: !!locationBookingId,
    placeholderData: (previousData) => previousData,
  });
}






















