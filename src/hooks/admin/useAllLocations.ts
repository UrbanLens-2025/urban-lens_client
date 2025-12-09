"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllLocationsForAdmin } from "@/api/admin";

export function useAllLocations(
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  isBusiness?: boolean
) {
  return useQuery({
    queryKey: ["allLocations", page, limit, search, sortBy, isBusiness],
    queryFn: () =>
      getAllLocationsForAdmin({
        page,
        limit,
        search,
        sortBy,
        isBusiness,
      }),
    placeholderData: (previousData) => previousData,
  });
}
