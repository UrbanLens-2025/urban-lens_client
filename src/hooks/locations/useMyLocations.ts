"use client";

import { getLocationRequests, getMyLocations } from "@/api/locations";
import { useQuery } from "@tanstack/react-query";

interface UseMyLocationsOptions {
  searchBy?: string[];
  sortBy?: string | string[];
  filterVisibleOnMap?: "true" | "false";
  limit?: number;
}

export function useMyLocations(
  page: number,
  search: string,
  options?: UseMyLocationsOptions
) {
  return useQuery({
    queryKey: [
      "myLocations",
      page,
      search,
      options?.sortBy,
      options?.filterVisibleOnMap,
      options?.limit,
      options?.searchBy,
    ],
    queryFn: () =>
      getMyLocations({
        page,
        search,
        sortBy: options?.sortBy,
        filterVisibleOnMap: options?.filterVisibleOnMap,
        limit: options?.limit,
        searchBy: options?.searchBy,
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
