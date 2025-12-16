"use client";

import { useQueries } from "@tanstack/react-query";
import { getAllPostsForAdmin } from "@/api/admin";

/**
 * Hook to fetch accurate post statistics by type and visibility
 * Makes separate lightweight API calls for each filter to get accurate counts
 */
export function usePostStats() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["postStats", "all"],
        queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1 }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["postStats", "review"],
        queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1, type: "review" }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["postStats", "blog"],
        queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1, type: "blog" }),
        select: (data) => data.meta.totalItems,
      },
      {
        queryKey: ["postStats", "public"],
        queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1, visibility: "public" }),
        select: (data) => data.meta.totalItems,
      },
    ],
  });

  const [allQuery, reviewQuery, blogQuery, publicQuery] = queries;

  return {
    total: allQuery.data ?? 0,
    reviews: reviewQuery.data ?? 0,
    checkIns: blogQuery.data ?? 0, // Using blog as check-ins for now
    public: publicQuery.data ?? 0,
    isLoading: allQuery.isLoading || reviewQuery.isLoading || blogQuery.isLoading || publicQuery.isLoading,
    isError: allQuery.isError || reviewQuery.isError || blogQuery.isError || publicQuery.isError,
  };
}
