"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { banPostPenalty } from "@/api/penalty";
import { toast } from "sonner";

type BanPostPayload = {
  targetEntityId: string;
  banReason: string;
};

export function useBanPostPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetEntityId, banReason }: BanPostPayload) =>
      banPostPenalty({ targetEntityId, targetEntityType: "post", banReason }),
    onSuccess: () => {
      toast.success("Post banned successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to ban post");
    },
  });
}


