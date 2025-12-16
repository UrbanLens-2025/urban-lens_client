"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllPostsForAdmin, GetAllPostsForAdminParams } from "@/api/admin";

export function useAllPosts(params: GetAllPostsForAdminParams) {
  return useQuery({
    queryKey: ["allPosts", params],
    queryFn: () => getAllPostsForAdmin(params),
    placeholderData: (previousData) => previousData,
  });
}

