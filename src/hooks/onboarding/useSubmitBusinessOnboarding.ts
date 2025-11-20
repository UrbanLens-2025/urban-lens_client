"use client";

import { submitBusinessOnboarding } from "@/api/user";
import { BusinessOnboardingPayload } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSubmitBusinessOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BusinessOnboardingPayload) => submitBusinessOnboarding(payload),
    onSuccess: async () => {
      toast.success("Your business profile has been submitted for review!");
      
      // Invalidate and refetch user queries to get fresh data
      await queryClient.invalidateQueries({ queryKey: ["user", "current"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      
      // Wait for the refetch to complete before navigating
      await queryClient.refetchQueries({ queryKey: ["user", "current"] });
      
      // Navigate to pending page after data is refreshed
      router.replace('/onboarding/pending');
    },
    onError: (err) => toast.error(err.message),
  });
}