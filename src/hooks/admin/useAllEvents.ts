"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllEventsForAdmin } from "@/api/admin";

export function useAllEvents(
  page: number,
  limit: number,
  search: string,
  sortBy: string
) {
  return useQuery({
    queryKey: ["allEvents", page, limit, search, sortBy],
    queryFn: () =>
      getAllEventsForAdmin({
        page,
        limit,
        search,
        sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });
}

