"use client";

import { getLocationRequests, getMyLocations } from "@/api/locations";
import { useQuery } from "@tanstack/react-query";

export function useMyLocations() {
  return useQuery({
    queryKey: ["myLocations"],
    queryFn: getMyLocations,
  });
}

export function useLocationRequests(
  page: number,
  search: string,
  sortBy: string
) {
  return useQuery({
    queryKey: ["locationRequests", page, search, sortBy],
    queryFn: () =>
      getLocationRequests({
        page,
        search,
        status: "APPROVED",
        sortBy,
      }),
  });
}