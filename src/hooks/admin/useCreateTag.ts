"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTag } from "@/api/admin";
import { CreateTagPayload } from "@/types";

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTagPayload) => createTag(payload),
    onSuccess: () => {
      toast.success("Tag created successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}