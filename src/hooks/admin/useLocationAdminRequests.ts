"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationRequestsForAdmin } from "@/api/admin";
import { LocationStatus } from "@/types";

export function useLocationAdminRequests(
  page: number,
  limit: number,
  search?: string,
  status?: LocationStatus,
  sortBy?: string
) {
  return useQuery({
    queryKey: ["locationRequests", page, limit, search, status, sortBy],
    queryFn: () =>
      getLocationRequestsForAdmin({
        page,
        limit,
        search,
        status,
        sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });
}
