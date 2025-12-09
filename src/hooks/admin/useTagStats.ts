"use client";

import { useQueries } from "@tanstack/react-query";
import { getTagsForAdmin } from "@/api/admin";

/**
 * Hook to fetch accurate tag statistics
 * Makes separate lightweight API calls for each category to get accurate counts
 */
export function useTagStats() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["tagStats", "all"],
        queryFn: () => getTagsForAdmin({ page: 1, limit: 1 }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["tagStats", "visible"],
        queryFn: () => getTagsForAdmin({ page: 1, limit: 1, isVisible: true }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["tagStats", "hidden"],
        queryFn: () => getTagsForAdmin({ page: 1, limit: 1, isVisible: false }),
        select: (data) => data.meta.totalItems,
      },
    ],
  });

  const [allQuery, visibleQuery, hiddenQuery] = queries;

  return {
    total: allQuery.data ?? 0,
    visible: visibleQuery.data ?? 0,
    hidden: hiddenQuery.data ?? 0,
    isLoading: allQuery.isLoading || visibleQuery.isLoading || hiddenQuery.isLoading,
    isError: allQuery.isError || visibleQuery.isError || hiddenQuery.isError,
  };
}

