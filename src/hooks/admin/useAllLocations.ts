"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllLocationsForAdmin } from "@/api/admin";

export function useAllLocations(
  page: number,
  limit: number,
  search?: string,
  sortBy?: string
) {
  return useQuery({
    queryKey: ["allLocations", page, limit, search, sortBy],
    queryFn: () =>
      getAllLocationsForAdmin({
        page,
        limit,
        search,
        sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });
}
