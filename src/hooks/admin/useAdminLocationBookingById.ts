"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminLocationBookingById } from "@/api/admin";

export function useAdminLocationBookingById(locationBookingId: string | null) {
  return useQuery({
    queryKey: ["adminLocationBooking", locationBookingId],
    queryFn: () => getAdminLocationBookingById(locationBookingId!),
    enabled: !!locationBookingId,
  });
}
