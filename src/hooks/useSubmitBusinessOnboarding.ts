"use client";

import { submitBusinessOnboarding } from "@/api/onboarding";
import { BusinessOnboardingPayload } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSubmitBusinessOnboarding() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: BusinessOnboardingPayload) => submitBusinessOnboarding(payload),
    onSuccess: () => {
      toast.success("Your business profile has been submitted for review!");
      router.push('/onboarding/pending');
    },
    onError: (err) => toast.error(err.message),
  });
}