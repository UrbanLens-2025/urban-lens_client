"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllEventsForAdmin } from "@/api/admin";

export function useAllEvents(page: number, search: string, sortBy: string) {
  return useQuery({
    queryKey: ["allEvents", page, search, sortBy],
    queryFn: () =>
      getAllEventsForAdmin({
        page,
        search,
        sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });
}

