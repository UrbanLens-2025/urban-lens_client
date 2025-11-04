"use client";

import { useQuery } from "@tanstack/react-query";
import { getOwnerLocationBookings } from "@/api/locations";
import { GetOwnerLocationBookingsParams } from "@/types";

export function useOwnerLocationBookings(params: GetOwnerLocationBookingsParams) {
  return useQuery({
    queryKey: ['ownerLocationBookings', params],
    queryFn: () => getOwnerLocationBookings(params),
    placeholderData: (previousData) => previousData,
  });
}

