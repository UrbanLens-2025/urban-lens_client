"use client";

import { useQuery } from "@tanstack/react-query";
import type { GetAllPostsForAdminParams, AdminPost } from "@/api/admin";
import { getMockPosts } from "@/mocks/adminPosts";

// TODO: Replace with actual API call when backend is ready
// import { getAllPostsForAdmin } from "@/api/admin";

export function useAllPosts(params: GetAllPostsForAdminParams) {
  return useQuery({
    queryKey: ["allPosts", params],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getMockPosts(params);
    },
    placeholderData: (previousData) => previousData,
  });
}

