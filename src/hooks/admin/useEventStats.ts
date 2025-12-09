"use client";

import { useQueries } from "@tanstack/react-query";
import { getAllEventsForAdmin } from "@/api/admin";

/**
 * Hook to fetch accurate event statistics by status
 * Makes separate lightweight API calls for each status to get accurate counts
 */
export function useEventStats() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["eventStats", "all"],
        queryFn: () => getAllEventsForAdmin({ page: 1, limit: 1 }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["eventStats", "PUBLISHED"],
        queryFn: () => getAllEventsForAdmin({ page: 1, limit: 1, status: "PUBLISHED" }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["eventStats", "DRAFT"],
        queryFn: () => getAllEventsForAdmin({ page: 1, limit: 1, status: "DRAFT" }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["eventStats", "CANCELLED"],
        queryFn: () => getAllEventsForAdmin({ page: 1, limit: 1, status: "CANCELLED" }),
        select: (data) => data.meta.totalItems,
      },
    ],
  });

  const [allQuery, publishedQuery, draftQuery, cancelledQuery] = queries;

  return {
    total: allQuery.data ?? 0,
    published: publishedQuery.data ?? 0,
    draft: draftQuery.data ?? 0,
    cancelled: cancelledQuery.data ?? 0,
    isLoading: allQuery.isLoading || publishedQuery.isLoading || draftQuery.isLoading || cancelledQuery.isLoading,
    isError: allQuery.isError || publishedQuery.isError || draftQuery.isError || cancelledQuery.isError,
  };
}

