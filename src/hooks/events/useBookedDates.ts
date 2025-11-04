"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookedDates } from "@/api/events";

export function useBookedDates(startDate: string | undefined, endDate: string | undefined) {
  return useQuery({
    queryKey: ["bookedDates", startDate, endDate],
    queryFn: () => getBookedDates(startDate!, endDate!),
    enabled: !!startDate && !!endDate,
  });
}

