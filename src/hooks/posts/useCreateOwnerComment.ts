"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOwnerComment, CreateOwnerCommentPayload } from "@/api/posts";
import { toast } from "sonner";

export function useCreateOwnerComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOwnerCommentPayload) => createOwnerComment(payload),
    onSuccess: (data, variables) => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({
        queryKey: ["postComments", { postId: variables.postId }],
      });
      // Invalidate post query to update comment count
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      toast.success("Comment posted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to post comment");
    },
  });
}

