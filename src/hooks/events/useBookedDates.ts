"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookedDates } from "@/api/events";

export function useBookedDates(
  locationId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined
) {
  return useQuery({
    queryKey: ["bookedDates", locationId, startDate, endDate],
    queryFn: () => getBookedDates(locationId!, startDate!, endDate!),
    enabled: !!locationId && !!startDate && !!endDate,
  });
}




