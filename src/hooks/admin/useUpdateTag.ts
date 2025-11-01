"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateTag } from "@/api/admin";
import { UpdateTagPayload } from "@/types";

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tagId,
      payload,
    }: {
      tagId: number;
      payload: UpdateTagPayload;
    }) => updateTag(tagId, payload),
    onSuccess: () => {
      toast.success("Tag updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminTags"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
