"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreatorOnboardingPayload } from "@/types";
import { submitCreatorOnboarding } from "@/api/user";

export function useSubmitCreatorOnboarding() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreatorOnboardingPayload) =>
      submitCreatorOnboarding(payload),

    onSuccess: () => {
      toast.success("Welcome! Your creator profile is ready.");

      queryClient.invalidateQueries({ queryKey: ["user"] });

      router.push("/");
    },
    onError: (err) => {
      toast.error(err.message || "Onboarding failed. Please try again.");
    },
  });
}
