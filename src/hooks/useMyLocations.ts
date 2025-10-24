"use client";

import { getLocationRequests, getMyLocations } from "@/api/locations";
import { useQuery } from "@tanstack/react-query";

export function useMyLocations(page: number, search: string) {
  return useQuery({
    queryKey: ["myLocations", page, search],
    queryFn: () =>
      getMyLocations({
        page,
        search,
      }),
    placeholderData: (previousData) => previousData,
  });
}

export function useLocationRequests(page: number, sortBy: string) {
  return useQuery({
    queryKey: ["locationRequests", page, sortBy],
    queryFn: () =>
      getLocationRequests({
        page,
        status: "APPROVED",
        sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });
}
