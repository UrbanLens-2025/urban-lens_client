"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllLocationsForAdmin } from "@/api/admin";

export function useAllLocations(page: number, search: string, sortBy: string) {
  return useQuery({
    queryKey: ["allLocations", page, search, sortBy],
    queryFn: () =>
      getAllLocationsForAdmin({
        page,
        search,
        sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });
}
