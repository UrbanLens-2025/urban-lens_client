"use client";
import { useQuery } from "@tanstack/react-query";
import { getLocationRequestsForAdmin } from "@/api/admin";

export function usePendingRequests(page: number, search: string) {
  return useQuery({
    queryKey: ['pendingLocationRequests', page, search],
    queryFn: () => getLocationRequestsForAdmin({ page, search, status: 'AWAITING_ADMIN_REVIEW' }),
    placeholderData: (previousData) => previousData,
  });
}