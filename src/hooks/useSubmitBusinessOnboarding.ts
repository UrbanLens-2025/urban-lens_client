"use client";

import { submitBusinessOnboarding } from "@/api/onboarding";
import { BusinessOnboardingPayload } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSubmitBusinessOnboarding() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: BusinessOnboardingPayload) => submitBusinessOnboarding(payload),
    onSuccess: () => {
      toast.success("Business profile created!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push('/');
    },
    onError: (err) => toast.error(err.message),
  });
}