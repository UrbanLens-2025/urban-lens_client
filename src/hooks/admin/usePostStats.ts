"use client";

import { useQuery } from "@tanstack/react-query";
import { mockPostStats } from "@/mocks/adminPosts";

// TODO: Replace with actual API calls when backend is ready
// import { getAllPostsForAdmin } from "@/api/admin";

/**
 * Hook to fetch accurate post statistics by type and visibility
 * Currently uses mock data - will be replaced with API calls when backend is ready
 */
export function usePostStats() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["postStats"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockPostStats;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    total: data?.total ?? 0,
    reviews: data?.reviews ?? 0,
    checkIns: data?.checkIns ?? 0,
    public: data?.public ?? 0,
    isLoading,
    isError,
  };

  // When API is ready, use this instead:
  // const queries = useQueries({
  //   queries: [
  //     {
  //       queryKey: ["postStats", "all"],
  //       queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1 }),
  //       select: (data) => data.meta.totalItems,
  //     },
  //     {
  //       queryKey: ["postStats", "REVIEW"],
  //       queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1, type: "REVIEW" }),
  //       select: (data) => data.meta.totalItems,
  //     },
  //     {
  //       queryKey: ["postStats", "CHECK_IN"],
  //       queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1, type: "CHECK_IN" }),
  //       select: (data) => data.meta.totalItems,
  //     },
  //     {
  //       queryKey: ["postStats", "PUBLIC"],
  //       queryFn: () => getAllPostsForAdmin({ page: 1, limit: 1, visibility: "PUBLIC" }),
  //       select: (data) => data.meta.totalItems,
  //     },
  //   ],
  // });
  //
  // const [allQuery, reviewQuery, checkInQuery, publicQuery] = queries;
  //
  // return {
  //   total: allQuery.data ?? 0,
  //   reviews: reviewQuery.data ?? 0,
  //   checkIns: checkInQuery.data ?? 0,
  //   public: publicQuery.data ?? 0,
  //   isLoading: allQuery.isLoading || reviewQuery.isLoading || checkInQuery.isLoading || publicQuery.isLoading,
  //   isError: allQuery.isError || reviewQuery.isError || checkInQuery.isError || publicQuery.isError,
  // };
}

