"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminPost } from "@/api/admin";
import { getMockPosts } from "@/mocks/adminPosts";

// TODO: Replace with actual API call when backend is ready
// import { getPostByIdForAdmin } from "@/api/admin";

export function usePostByIdForAdmin(postId: string | null) {
  return useQuery({
    queryKey: ["adminPost", postId],
    queryFn: async () => {
      if (!postId) return null;
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Get all posts and find the one with matching ID
      const result = getMockPosts({ page: 1, limit: 1000 });
      const post = result.data.find((p) => p.postId === postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Enhance with analytics if not present
      return {
        ...post,
        analytics: post.analytics || {
          totalUpvotes: 0,
          totalDownvotes: 0,
          totalComments: 0,
        },
      } as AdminPost & {
        analytics: {
          totalUpvotes: number;
          totalDownvotes: number;
          totalComments: number;
        };
      };
    },
    enabled: !!postId,
  });
}

